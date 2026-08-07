/* AIWine — checkout re-price + commission endpoint (Vercel serverless).
   DRAFT for the payment phase (cart is gated until go-live). Deploys with the
   portal repo at /api/checkout-reprice.

   WHY: the browser must NEVER decide what to charge. The client posts only the
   cart lines (wine id + qty) + delivery method + gifts + member flag. This
   endpoint fetches LIVE price + stock from Supabase, recomputes the whole order
   (grouping, discounts, postage, GST) and the AIWine commission server-side via
   _pricing.js, and returns the authoritative amount. The Stripe Checkout Session
   is then created from THAT amount — the client total is only cross-checked, never
   trusted.

   Env (Vercel → portal project):
     SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
     STRIPE_SECRET_KEY            (sk_live_… at go-live)   — create the session
     CHECKOUT_ALLOW_ORIGIN        https://www.aiwine.co.nz (CORS)

   NOTE: Stripe session creation is stubbed below (marked TODO) so this can be
   reviewed now; wire it when the live keys exist. The re-price + commission math
   is complete and testable today. */

const { reprice } = require('./_pricing');

module.exports.config = { api: { bodyParser: true } };

async function fetchWines(sbUrl, sbKey, ids) {
  // service-role read: live price + stock for exactly the requested ids.
  const inList = ids.map((id) => `"${String(id).replace(/[^\w-]/g, '')}"`).join(',');
  const url = `${sbUrl.replace(/\/+$/, '')}/rest/v1/wines?id=in.(${inList})&select=id,name,winery,region,price,stock,published`;
  const r = await fetch(url, { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } });
  if (!r.ok) throw new Error('wines_fetch_failed:' + r.status);
  const rows = await r.json();
  const map = {};
  for (const w of rows) {
    if (w.published === false) continue;          // never sell an unpublished wine
    map[w.id] = { price: Number(w.price), stock: Number(w.stock), winery: w.winery, name: w.name, region: w.region };
  }
  return map;
}

async function fetchSettings(sbUrl, sbKey) {
  // per-winery store settings that affect price (free threshold, dozen discount, pause, min).
  const url = `${sbUrl.replace(/\/+$/, '')}/rest/v1/wineries?select=name,free_threshold,min_order,mixed_cases,paused,dozen_on,dozen_rate`;
  const r = await fetch(url, { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } });
  if (!r.ok) return {};
  const rows = await r.json();
  const map = {};
  for (const w of rows) {
    map[w.name] = {
      freeThreshold: w.free_threshold, minOrder: w.min_order, mixed: w.mixed_cases,
      paused: w.paused, dozenOn: w.dozen_on, dozenRate: w.dozen_rate,
    };
  }
  return map;
}

module.exports = async function handler(req, res) {
  const origin = process.env.CHECKOUT_ALLOW_ORIGIN || '';
  if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'POST'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }

  const sbUrl = process.env.SUPABASE_URL, sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !sbKey) { res.status(500).json({ error: 'not_configured' }); return; }

  const body = req.body || {};
  const lines = Array.isArray(body.lines) ? body.lines.slice(0, 200) : [];
  if (!lines.length) { res.status(400).json({ error: 'empty_cart' }); return; }
  const ids = [...new Set(lines.map((l) => l.id))];

  let wines, settings;
  try {
    [wines, settings] = await Promise.all([
      fetchWines(sbUrl, sbKey, ids),
      fetchSettings(sbUrl, sbKey),
    ]);
  } catch (e) {
    res.status(502).json({ error: 'db_error', detail: String(e.message || e) }); return;
  }

  const result = reprice({
    lines,
    wines,
    settings,
    groups: body.groups || {},          // brand->group map (from site config; move to DB at go-live)
    member: !!body.member,
    market: body.market || {},
  });
  if (!result.ok) { res.status(409).json(result); return; }   // stock/min/paused problem → client re-syncs

  const order = result.order;

  // Cross-check the client's claimed total (informational; server value wins).
  const claimed = Number(body.clientTotal);
  const mismatch = Number.isFinite(claimed) && Math.abs(claimed - order.total) > 0.01;

  // --- TODO (go-live): create the Stripe Checkout Session from order.amountCents ---
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const session = await stripe.checkout.sessions.create({
  //   mode: 'payment',
  //   line_items: [{ price_data: { currency: order.currency.toLowerCase(),
  //     product_data: { name: `AIWine order · ${order.count} bottles` },
  //     unit_amount: order.amountCents }, quantity: 1 }],
  //   metadata: { orderRef: body.orderRef || '', deliveryMethod: body.delivery?.method || 'deliver' },
  //   success_url: origin + '/thank-you.html?session_id={CHECKOUT_SESSION_ID}',
  //   cancel_url: origin + '/checkout.html',
  // });
  // The webhook (stripe-webhook.js) then writes the order + commission snapshot +
  // decrements stock on checkout.session.completed (idempotent on session id),
  // carrying order.gifts (jsonb) and order.delivery.method — see PAYMENT-PHASE-TODO.md.

  res.status(200).json({
    ok: true,
    order,                    // authoritative amount, per-shipment commission snapshot
    clientMismatch: mismatch, // true if the browser's number disagreed (log/alert)
    // checkoutUrl: session.url,   // ← uncomment with the Stripe block above
  });
};

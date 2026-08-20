/* AIWine — checkout re-price + commission endpoint (Vercel serverless).
   DRAFT for the payment phase (cart is gated until go-live). Deploys with the
   portal repo at /api/checkout-reprice.

   WHY: the browser must NEVER decide what to charge. The client posts only the
   cart lines (wine id + qty) + delivery method + gifts, plus its Supabase access
   token and (optionally) a promo CODE. This endpoint fetches LIVE price + stock
   from Supabase, VERIFIES the caller's identity and membership, VALIDATES the
   promo code itself, recomputes the whole order (grouping, discounts, postage,
   GST) and the AIWine commission server-side via _pricing.js, and returns the
   authoritative amount. The Stripe Checkout Session is then created from THAT
   amount — the client total is only cross-checked, never trusted.

   TRUST RULES (audit findings C2/C3):
     • membership   — read from profiles.member for the VERIFIED user id.
                      A `member` field in the request body is IGNORED.
     • promo codes  — the client may send only `promoCode`; the percentage and
                      expiry come from validate_promo / promo_codes server-side.
                      A `promoPct` in the request body is IGNORED.

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
  // NOTE: `wines` has no `winery` text column — the winery NAME comes from the
  // embedded wineries relation via wines."wineryId" (the same FK the RLS policy
  // in migration 01 uses). Selecting a bare `winery` column would 400.
  const inList = ids.map((id) => `"${String(id).replace(/[^\w-]/g, '')}"`).join(',');
  const url = `${sbUrl.replace(/\/+$/, '')}/rest/v1/wines?id=in.(${inList})&select=id,name,"wineryId",region,price,stock,published,wineries(id,name)`;
  const r = await fetch(url, { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } });
  if (!r.ok) throw new Error('wines_fetch_failed:' + r.status);
  const rows = await r.json();
  const map = {};
  for (const w of rows) {
    if (w.published === false) continue;          // never sell an unpublished wine
    const wy = w.wineries || {};
    map[w.id] = {
      price: Number(w.price), stock: Number(w.stock),
      wineryId: w.wineryId || wy.id || null,
      winery: wy.name || '',                      // display/grouping label only
      name: w.name, region: w.region,
      published: w.published !== false,           // carried through for the hard block
    };
  }
  return map;
}

async function fetchSettings(sbUrl, sbKey, wineryIds) {
  // per-winery store settings that affect price (free threshold, dozen discount, pause, min).
  // Scoped to the winery IDS in this cart. An unbounded select silently hits
  // PostgREST's default row cap as the directory grows, dropping some wineries'
  // settings to defaults (a hidden mispricing). Keyed by BOTH id and name so
  // _pricing.js can resolve on the stable id and fall back to the name.
  const base = `${sbUrl.replace(/\/+$/, '')}/rest/v1/wineries?select=id,name,free_threshold,min_order,mixed_cases,paused,dozen_on,dozen_rate&limit=500`;
  let url = base;
  if (Array.isArray(wineryIds) && wineryIds.length) {
    const inList = wineryIds.map((id) => `"${String(id).replace(/"/g, '')}"`).join(',');
    url = `${base}&id=in.(${inList})`;
  }
  const r = await fetch(url, { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } });
  if (!r.ok) return {};
  const rows = await r.json();
  const map = {};
  for (const w of rows) {
    const s = {
      freeThreshold: w.free_threshold, minOrder: w.min_order, mixed: w.mixed_cases,
      paused: w.paused, dozenOn: w.dozen_on, dozenRate: w.dozen_rate,
    };
    if (w.id != null) map[w.id] = s;
    if (w.name) map[w.name] = s;
  }
  return map;
}

module.exports = async function handler(req, res) {
  const origin = process.env.CHECKOUT_ALLOW_ORIGIN || '';
  if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'POST'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }

  const sbUrl = process.env.SUPABASE_URL, sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !sbKey) { res.status(500).json({ error: 'not_configured' }); return; }

  const body = req.body || {};
  const lines = Array.isArray(body.lines) ? body.lines.slice(0, 200) : [];
  if (!lines.length) { res.status(400).json({ error: 'empty_cart' }); return; }
  const ids = [...new Set(lines.map((l) => l.id))];

  // --- Identity: verify the caller's token; NEVER trust body.member ---------
  // No token (guest) simply means "not a member" — checkout still works.
  let userId = null, member = false;
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token) {
    try {
      const who = await fetch(`${sbUrl.replace(/\/+$/, '')}/auth/v1/user`, {
        headers: { apikey: sbKey, Authorization: `Bearer ${token}` },
      });
      if (who.ok) {
        const u = await who.json();
        userId = (u && u.id) || null;
        if (userId) {
          const pr = await fetch(`${sbUrl.replace(/\/+$/, '')}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=member`, {
            headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
          });
          if (pr.ok) { const rows = await pr.json(); member = !!(rows && rows[0] && rows[0].member); }
        }
      }
    } catch (e) { userId = null; member = false; }
  }

  // --- Promo: the client sends a CODE ONLY; we derive the percentage ---------
  let promoPct = 0, promoCode = null, promoRejected = null;
  const rawCode = typeof body.promoCode === 'string' ? body.promoCode.trim().toUpperCase().slice(0, 40) : '';
  if (rawCode) {
    if (!member) {
      promoRejected = 'members_only';
    } else {
      try {
        const pc = await fetch(`${sbUrl.replace(/\/+$/, '')}/rest/v1/promo_codes?code=eq.${encodeURIComponent(rawCode)}&select=code,pct,expires_at,active`, {
          headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` },
        });
        const row = pc.ok ? (await pc.json())[0] : null;
        if (!row || row.active === false) promoRejected = 'unknown_code';
        else if (row.expires_at && new Date(row.expires_at) < new Date()) promoRejected = 'expired';
        else { promoPct = Math.max(0, Math.min(Number(row.pct) / 100, 0.5)); promoCode = row.code; }
      } catch (e) { promoRejected = 'lookup_failed'; }
    }
  }

  let wines, settings;
  try {
    wines = await fetchWines(sbUrl, sbKey, ids);
    // Settings are fetched for the winery IDS in this cart (the stable key), and
    // the map is keyed by both id and name so _pricing.js can resolve either way.
    const wineryIds = [...new Set(Object.values(wines).map((w) => w.wineryId).filter(Boolean))];
    settings = await fetchSettings(sbUrl, sbKey, wineryIds);
  } catch (e) {
    res.status(502).json({ error: 'db_error', detail: String(e.message || e) }); return;
  }

  const result = reprice({
    lines,
    wines,
    settings,
    groups: body.groups || {},          // brand->group map (from site config; move to DB at go-live)
    member,                             // server-verified, NOT body.member
    promoPct,                           // server-derived, NOT body.promoPct
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
    member,                   // what the SERVER decided (client should re-render from this)
    promo: promoCode ? { code: promoCode, pct: promoPct } : null,
    promoRejected,            // 'members_only' | 'unknown_code' | 'expired' | 'lookup_failed' | null
    clientMismatch: mismatch, // true if the browser's number disagreed (log/alert)
    // checkoutUrl: session.url,   // ← uncomment with the Stripe block above
  });
};

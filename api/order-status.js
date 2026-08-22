// AIWine — order confirmation lookup.  (OPEN-WORK #55)
// GET /api/order-status?session_id=cs_live_…
//
// WHY THIS EXISTS
// The success page used to trust `?paid=1` in the URL. That is not proof of
// anything: it clears the customer's cart and records an order on the strength
// of a query string. Two real failure modes came out of it —
//   1. On an installed iPhone app, Stripe's return can land in a DIFFERENT
//      browsing context, so sessionStorage (which held the pending order) is
//      gone. The old page then cleared the cart and recorded nothing: the
//      customer had paid and had no order.
//   2. Anyone typing ?paid=1 emptied their own cart and got a fake order.
//
// So the browser now ASKS THE SERVER whether the order exists, and the success
// page only clears the cart when the answer is yes.
//
// SECURITY
// The Stripe session id is the capability — unguessable (cs_ + ~58 random
// chars) and known only to the browser that completed that checkout. Even so,
// this endpoint returns the MINIMUM needed to render a confirmation: order
// ids, bottle count, total, placed-at. Never a name, email, address or phone.
// The service-role key stays server-side; the browser gets no database access.
//
// ENV (Vercel → portal project):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   ORDER_STATUS_ALLOW_ORIGINS   comma-separated; falls back to
//                                ERROR_SINK_ALLOW_ORIGINS, then open CORS
//
// Reads `orders."paymentRef"` (Stripe session id — portal/supabase/26-record-paid-order.sql)
// and `stripe_events` (portal/supabase/24-stripe-events.sql) so a webhook that
// FAILED is reported as failed rather than as "still waiting" forever.

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;          // a polling page makes ~15 calls per checkout
const hits = new Map();

function throttled(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.start > WINDOW_MS) { hits.set(ip, { start: now, n: 1 }); return false; }
  rec.n += 1;
  if (hits.size > 5000) hits.clear();
  return rec.n > MAX_PER_WINDOW;
}

async function sbGet(url, key, path) {
  const r = await fetch(url.replace(/\/+$/, '') + path, {
    headers: { apikey: key, Authorization: 'Bearer ' + key, Accept: 'application/json' },
  });
  if (!r.ok) throw new Error('supabase ' + r.status);
  return r.json();
}

module.exports = async function handler(req, res) {
  const allowed = (process.env.ORDER_STATUS_ALLOW_ORIGINS || process.env.ERROR_SINK_ALLOW_ORIGINS || '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.origin || '';
  if (!allowed.length) res.setHeader('Access-Control-Allow-Origin', '*');
  else if (allowed.includes(origin)) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // Never cached: the whole point is to observe a state that is changing.
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ status: 'error', error: 'method' }); return; }
  if (allowed.length && origin && !allowed.includes(origin)) { res.status(403).json({ status: 'error', error: 'origin' }); return; }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (throttled(ip)) { res.status(429).json({ status: 'error', error: 'slow_down' }); return; }

  const sid = String((req.query && req.query.session_id) || '').trim();
  // Shape check before touching the database — a Stripe session id is
  // `cs_` + base-ish characters. Anything else is not worth a query.
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(sid)) { res.status(400).json({ status: 'error', error: 'bad_session_id' }); return; }

  const sbUrl = process.env.SUPABASE_URL, sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !sbKey) { res.status(200).json({ status: 'error', error: 'server_not_configured' }); return; }

  try {
    // One checkout can produce SEVERAL orders — one per winery shipping.
    const rows = await sbGet(sbUrl, sbKey,
      '/rest/v1/orders?select=id,total,status,%22placedAt%22,%22wineryId%22&%22paymentRef%22=eq.' + encodeURIComponent(sid));

    if (rows && rows.length) {
      res.status(200).json({
        status: 'confirmed',
        orders: rows.map((o) => ({ id: o.id, total: +o.total || 0, status: o.status || 'new' })),
        wineries: new Set(rows.map((o) => o.wineryId)).size,
        total: rows.reduce((s, o) => s + (+o.total || 0), 0),
        placedAt: rows.map((o) => o.placedAt).sort()[0] || null,
      });
      return;
    }

    // No order yet. Distinguish "the webhook hasn't arrived" from "it arrived
    // and broke" — the second must not leave the customer waiting on a page
    // that will never change.
    let ev = [];
    try {
      ev = await sbGet(sbUrl, sbKey,
        '/rest/v1/stripe_events?select=status,type,received_at&session_id=eq.' + encodeURIComponent(sid) + '&order=received_at.desc&limit=1');
    } catch (e) {}
    const st = ev && ev[0] && ev[0].status;
    if (st === 'failed' || st === 'unmatched') {
      res.status(200).json({ status: 'failed', seen: st });
      return;
    }
    res.status(200).json({ status: 'pending', seen: st || null });
  } catch (e) {
    // An error here must read as "not yet confirmed", never as "confirmed" —
    // the page's job is to avoid clearing a cart it cannot justify clearing.
    res.status(200).json({ status: 'error', error: 'lookup_failed' });
  }
};

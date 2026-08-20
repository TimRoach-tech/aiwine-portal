// AIWine — client error sink (Vercel serverless, portal project).
// POST /api/report-error
//
// WHY: the codebase swallows errors widely (catch {} / .catch(()=>{})) to keep the
// UI smooth. That hid at least three real bugs: store settings that looked saved
// but never reached the database, bottle photos that reported success then
// vanished, and a signup email that failed invisibly. Swallow-sites can now
// REPORT instead of disappearing, without changing what the user sees.
//
// Design rules:
//   • never throws, never blocks the caller (fire-and-forget from the client)
//   • always 200/204 so a reporting failure can't cascade into a UI failure
//   • no secrets leave the browser; the service-role key stays server-side
//   • small, bounded payload; per-IP throttle so it can't be used as a firehose
//
// ENV (Vercel → portal project):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   ERROR_SINK_ALLOW_ORIGINS   comma-separated, e.g.
//                              https://www.aiwine.co.nz,https://portal.aiwine.co.nz
//
// Requires table public.client_errors (portal/supabase/25-hardening-sweep.sql).

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;         // per IP per minute
const hits = new Map();            // best-effort, per warm instance

function throttled(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.start > WINDOW_MS) { hits.set(ip, { start: now, n: 1 }); return false; }
  rec.n += 1;
  if (hits.size > 5000) hits.clear();   // crude bound on memory
  return rec.n > MAX_PER_WINDOW;
}

const clip = (v, n) => (v == null ? null : String(v).slice(0, n));

module.exports.config = { api: { bodyParser: true } };

module.exports = async function handler(req, res) {
  // CORS: only our own surfaces may report.
  const allowed = (process.env.ERROR_SINK_ALLOW_ORIGINS || '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.origin || '';
  if (allowed.length && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ ok: false }); return; }
  // Reject unknown origins once a list is configured (browser calls always send one).
  if (allowed.length && origin && !allowed.includes(origin)) { res.status(204).end(); return; }

  try {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    if (throttled(ip)) { res.status(204).end(); return; }

    const sbUrl = process.env.SUPABASE_URL, sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!sbUrl || !sbKey) { res.status(204).end(); return; }   // silent no-op, never break the caller

    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    b = b || {};

    // Resolve the user only if a token was supplied — reporting must work for guests.
    let userId = null;
    const authz = req.headers.authorization || '';
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
    if (token) {
      try {
        const who = await fetch(`${sbUrl.replace(/\/+$/, '')}/auth/v1/user`, {
          headers: { apikey: sbKey, Authorization: `Bearer ${token}` },
        });
        if (who.ok) { const u = await who.json(); userId = (u && u.id) || null; }
      } catch (e) { /* anonymous report is still useful */ }
    }

    const row = {
      surface:   clip(b.surface, 20) || 'website',
      kind:      clip(b.kind, 40) || 'unknown',
      message:   clip(b.message, 500),
      context:   (b.context && typeof b.context === 'object') ? b.context : null,
      user_id:   userId,
      winery_id: clip(b.wineryId, 60),
      url:       clip(b.url || req.headers.referer, 300),
      ua:        clip(req.headers['user-agent'], 300),
    };

    await fetch(`${sbUrl.replace(/\/+$/, '')}/rest/v1/client_errors`, {
      method: 'POST',
      headers: {
        apikey: sbKey, Authorization: `Bearer ${sbKey}`,
        'Content-Type': 'application/json', Prefer: 'return=minimal',
      },
      body: JSON.stringify(row),
    });

    res.status(204).end();
  } catch (e) {
    // The error reporter must never itself become an error the caller has to handle.
    res.status(204).end();
  }
};

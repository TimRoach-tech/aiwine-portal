// AIWine portal — notify admin when a winery submits a signup / add-winery request.
// Called fire-and-forget by store.requestAccess() right after a 'pending' request
// lands, so you get an email the moment one hits the CRM queue.
//
// Deploy as a Vercel serverless function in the PORTAL project.
// ENV (Vercel project settings — never in config.js):
//   RESEND_API_KEY      re_…                       (same key the CRM uses)
//   MAIL_FROM_NZ        "AIWine <hello@aiwine.co.nz>"   (from address; fallback below)
//   SIGNUP_NOTIFY_TO    tim@aiwine.co.nz           (where to send the alert;
//                                                    comma-separate for several)
// No npm deps — Resend via fetch. Best-effort: never blocks the winery's request.

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// throttle state (best-effort, per warm instance)
const SENDS = new Map();
const DAY = { start: Date.now(), n: 0 };

module.exports = async (req, res) => {
  // CORS: only our own surfaces may trigger a staff email. An open endpoint here
  // is an email-flood / Resend-quota vector, and it buries the very alert channel
  // staff rely on (audit Medium finding).
  const allowed = (process.env.SIGNUP_NOTIFY_ORIGINS ||
    'https://portal.aiwine.co.nz,https://www.aiwine.co.nz,https://aiwine.co.nz')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.origin || '';
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (origin && !allowed.includes(origin)) return res.status(403).json({ error: 'origin_not_allowed' });

  // Require a signed-in caller: the winery always has a session at this point,
  // so an unauthenticated POST is never legitimate.
  const sbUrl = process.env.SUPABASE_URL, sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authz = req.headers.authorization || '';
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
  if (sbUrl && sbKey) {
    if (!token) return res.status(401).json({ error: 'sign_in_required' });
    try {
      const who = await fetch(`${sbUrl.replace(/\/+$/, '')}/auth/v1/user`, {
        headers: { apikey: sbKey, Authorization: `Bearer ${token}` },
      });
      if (!who.ok) return res.status(401).json({ error: 'bad_session' });
    } catch (e) { return res.status(401).json({ error: 'session_check_failed' }); }
  }

  // Per-IP throttle + a daily cap, so a loop can't drain the Resend quota.
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const rec = SENDS.get(ip);
  if (!rec || now - rec.start > 60_000) SENDS.set(ip, { start: now, n: 1 });
  else if (++rec.n > 5) return res.status(429).json({ error: 'too_many_requests' });
  if (now - DAY.start > 86_400_000) { DAY.start = now; DAY.n = 0; }
  if (++DAY.n > 200) return res.status(429).json({ error: 'daily_cap' });

  try {
    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    b = b || {};
    const wineryName = (b.wineryName || '').toString().slice(0, 200) || 'A winery';
    const to = (process.env.SIGNUP_NOTIFY_TO || 'tim@aiwine.co.nz')
      .split(',').map((s) => s.trim()).filter(Boolean);
    const from = process.env.MAIL_FROM_NZ || 'AIWine <hello@aiwine.co.nz>';

    if (!process.env.RESEND_API_KEY) return res.status(200).json({ ok: false, skipped: 'no RESEND_API_KEY' });

    const rows = [
      ['Winery', wineryName],
      ['Contact', b.contact || '—'],
      ['Email', b.email || '—'],
      ['Region', b.region || '—'],
      ['Website', b.website || '—'],
      ['Message', b.message || '—'],
    ].map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#6b6b6b">${esc(k)}</td><td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`).join('');

    const html =
      `<p>A new winery request is waiting for review in the AIWine CRM.</p>` +
      `<table style="border-collapse:collapse;font:14px system-ui,Arial">${rows}</table>` +
      `<p style="margin-top:16px"><a href="https://crm.aiwine.co.nz/#/signups" style="display:inline-block;background:#7a1f2b;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:600">Review in the CRM</a></p>`;
    const text =
      `New winery request pending review.\n\n` +
      `Winery: ${wineryName}\nContact: ${b.contact || '—'}\nEmail: ${b.email || '—'}\n` +
      `Region: ${b.region || '—'}\nWebsite: ${b.website || '—'}\nMessage: ${b.message || '—'}\n\n` +
      `Review: https://crm.aiwine.co.nz/#/signups`;

    const rs = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject: `New winery signup: ${wineryName}`, html, text }),
    });
    if (!rs.ok) return res.status(200).json({ ok: false, error: `Resend ${rs.status}` });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String((e && e.message) || e) });
  }
};

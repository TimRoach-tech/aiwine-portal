// AIWine portal — invite a colleague to a winery.
// POST /api/invite-user   { wineryId, email, role }
//
// WHY THIS IS SERVER-SIDE: linking a user to a winery grants access to that
// winery's orders, customers and payout details. That is a privilege escalation,
// so it must not be a client-side insert. This endpoint verifies the CALLER is an
// OWNER of the winery it names before linking anyone, using the service-role key
// that never reaches a browser.
//
// Two paths, both idempotent:
//   • the email already has an AIWine login  -> link it to the winery
//   • the email is new                       -> Supabase Auth invite, then link
//
// ENV (Vercel -> portal project):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   INVITE_ALLOW_ORIGINS   comma-separated; defaults to the portal + winery app
//   INVITE_REDIRECT_TO     where the invite link lands (default portal root)

const clip = (v, n) => (v == null ? '' : String(v).slice(0, n));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

module.exports = async (req, res) => {
  const allowed = (process.env.INVITE_ALLOW_ORIGINS ||
    'https://portal.aiwine.co.nz,https://winery.aiwine.co.nz')
    .split(',').map(s => s.trim()).filter(Boolean);
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

  const sbUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !sbKey) return res.status(500).json({ error: 'server_not_configured' });

  const svc = (path, init) => fetch(`${sbUrl}${path}`, Object.assign({
    headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
  }, init || {}));

  try {
    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    b = b || {};
    const wineryId = clip(b.wineryId, 80);
    const email = clip(b.email, 200).trim().toLowerCase();
    const role = b.role === 'staff' ? 'staff' : 'owner';
    if (!wineryId) return res.status(400).json({ error: 'winery_required' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'invalid_email' });

    // --- 1. Who is asking? Verify the token, never trust a body field. -------
    const authz = req.headers.authorization || '';
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'sign_in_required' });
    const who = await fetch(`${sbUrl}/auth/v1/user`, {
      headers: { apikey: sbKey, Authorization: `Bearer ${token}` },
    });
    if (!who.ok) return res.status(401).json({ error: 'bad_session' });
    const caller = await who.json();
    const callerId = caller && caller.id;
    if (!callerId) return res.status(401).json({ error: 'bad_session' });

    // --- 2. Is the caller an OWNER of THIS winery? --------------------------
    const memQ = await svc(`/rest/v1/winery_users?select=role&userId=eq.${encodeURIComponent(callerId)}&wineryId=eq.${encodeURIComponent(wineryId)}`);
    const mem = memQ.ok ? await memQ.json() : [];
    if (!mem.length) return res.status(403).json({ error: 'not_a_member' });
    if ((mem[0].role || 'owner') !== 'owner') return res.status(403).json({ error: 'not_an_owner' });

    // --- 3. Does this email already have a login? --------------------------
    let userId = null, invited = false;
    const found = await svc(`/auth/v1/admin/users?filter=${encodeURIComponent(email)}`);
    if (found.ok) {
      const j = await found.json();
      const list = Array.isArray(j) ? j : (j.users || []);
      const hit = list.find(u => (u.email || '').toLowerCase() === email);
      if (hit) userId = hit.id;
    }

    // --- 4. New person: send a Supabase Auth invite ------------------------
    if (!userId) {
      const redirectTo = process.env.INVITE_REDIRECT_TO || 'https://portal.aiwine.co.nz';
      const inv = await svc('/auth/v1/admin/invite', {
        method: 'POST',
        body: JSON.stringify({ email, redirect_to: redirectTo }),
      });
      if (!inv.ok) {
        const detail = await inv.text();
        return res.status(502).json({ error: 'invite_failed', detail: clip(detail, 300) });
      }
      const created = await inv.json();
      userId = created && created.id;
      invited = true;
      if (!userId) return res.status(502).json({ error: 'invite_no_user' });
    }

    // --- 5. Link them to the winery (idempotent) ---------------------------
    const link = await svc('/rest/v1/winery_users', {
      method: 'POST',
      headers: {
        apikey: sbKey, Authorization: `Bearer ${sbKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({ userId, wineryId, role, invited_by: caller.email || null }),
    });
    if (!link.ok) {
      const detail = await link.text();
      return res.status(502).json({ error: 'link_failed', detail: clip(detail, 300) });
    }

    return res.status(200).json({ ok: true, invited, existing: !invited, email, role });
  } catch (e) {
    return res.status(500).json({ error: 'unexpected', detail: clip(e && e.message, 300) });
  }
};

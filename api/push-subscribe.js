// AIWine — register a device for push notifications.
// POST /api/push-subscribe    { wineryId, subscription }   -> save
// POST /api/push-subscribe    { endpoint, remove: true }    -> forget this device
//
// The winery app calls this after the user grants permission. One row per device
// (endpoint is unique), so a re-subscribe updates rather than duplicates.
//
// ENV: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PUSH_ALLOW_ORIGINS

const clip = (v, n) => (v == null ? null : String(v).slice(0, n));

module.exports = async (req, res) => {
  const allowed = (process.env.PUSH_ALLOW_ORIGINS ||
    'https://winery.aiwine.co.nz,https://portal.aiwine.co.nz')
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

  try {
    // Identify the caller — a device must belong to a real signed-in user.
    const authz = req.headers.authorization || '';
    const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'sign_in_required' });
    const who = await fetch(`${sbUrl}/auth/v1/user`, {
      headers: { apikey: sbKey, Authorization: `Bearer ${token}` },
    });
    if (!who.ok) return res.status(401).json({ error: 'bad_session' });
    const user = await who.json();
    if (!user || !user.id) return res.status(401).json({ error: 'bad_session' });

    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    b = b || {};

    const svc = (path, init) => fetch(`${sbUrl}${path}`, Object.assign({
      headers: {
        apikey: sbKey, Authorization: `Bearer ${sbKey}`,
        'Content-Type': 'application/json', Prefer: 'return=minimal',
      },
    }, init || {}));

    // --- unsubscribe -------------------------------------------------------
    if (b.remove) {
      const ep = clip(b.endpoint, 500);
      if (!ep) return res.status(400).json({ error: 'endpoint_required' });
      // Scoped to this user, so one login cannot delete another's device.
      await svc(`/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(ep)}&user_id=eq.${encodeURIComponent(user.id)}`, { method: 'DELETE' });
      return res.status(200).json({ ok: true, removed: true });
    }

    // --- subscribe ---------------------------------------------------------
    const sub = b.subscription || {};
    const endpoint = clip(sub.endpoint, 500);
    const keys = sub.keys || {};
    if (!endpoint || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'invalid_subscription' });
    }

    const row = {
      user_id: user.id,
      winery_id: clip(b.wineryId, 80),
      endpoint,
      p256dh: clip(keys.p256dh, 200),
      auth: clip(keys.auth, 100),
      user_agent: clip(req.headers['user-agent'], 300),
      last_seen: new Date().toISOString(),
      failures: 0,
      last_error: null,
    };

    // endpoint is UNIQUE, so merge-duplicates makes re-subscribing idempotent —
    // the same device re-registering (after a permission reset, or a new winery
    // selection) updates its row instead of piling up duplicates.
    const up = await svc('/rest/v1/push_subscriptions', {
      method: 'POST',
      headers: {
        apikey: sbKey, Authorization: `Bearer ${sbKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(row),
    });
    if (!up.ok) {
      const detail = await up.text();
      return res.status(502).json({ error: 'save_failed', detail: clip(detail, 300) });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'unexpected', detail: clip(e && e.message, 300) });
  }
};

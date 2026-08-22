// AIWine — send a push notification to a winery's devices.
// POST /api/push-send   { wineryId, kind, title, body, url }
//   Auth: either  x-internal-key: <PUSH_INTERNAL_KEY>   (webhook / cron)
//         or      Bearer <token> for a user who belongs to that winery (testing)
//
// ---------------------------------------------------------------------------
// DESIGN DECISION — PAYLOAD-LESS PUSH ("tickle")
// ---------------------------------------------------------------------------
// The Web Push spec allows an ENCRYPTED payload, but doing that properly means
// aes128gcm + ECDH key agreement per subscription — in practice, the `web-push`
// npm package. This codebase has zero npm dependencies and deploys by committing
// files, so hand-rolling that crypto would be the most fragile code here and the
// least testable.
//
// Instead we send an EMPTY push. The service worker receives the event, shows a
// notification from a small set of pre-written messages chosen by `kind` (passed
// through the notification tag), and the app loads the real detail when opened.
// Cost: notification text is generic ("A new order came in") rather than naming
// the customer. Benefit: no crypto to get wrong, and NO CUSTOMER DATA is handed
// to Apple's or Google's push service — which for order notifications is
// arguably the better privacy position anyway.
//
// VAPID (the part we DO need) is a signed JWT proving who is sending. That is
// ES256 over a P-256 key and is ~20 lines with Node's crypto, no deps.
//
// ENV (Vercel -> portal project):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   VAPID_PUBLIC_KEY      base64url, 65 bytes uncompressed (starts 'B')
//   VAPID_PRIVATE_KEY     PKCS#8 PEM, newlines as \n
//   VAPID_SUBJECT         mailto:hello@aiwine.co.nz
//   PUSH_INTERNAL_KEY     long random string, for server-to-server calls
//
// Generate the keys once (Node 18+, anywhere):
//   node -e "const c=require('crypto');const{publicKey,privateKey}=c.generateKeyPairSync('ec',{namedCurve:'prime256v1'});console.log('VAPID_PUBLIC_KEY=',publicKey.export({type:'spki',format:'der'}).subarray(26).toString('base64url'));console.log('VAPID_PRIVATE_KEY=',JSON.stringify(privateKey.export({type:'pkcs8',format:'pem'})))"

const crypto = require('crypto');

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const clip = (v, n) => (v == null ? '' : String(v).slice(0, n));

// DER (r,s) -> raw 64-byte JOSE signature. Node signs in DER; JWT wants raw.
function derToJose(der) {
  let off = 2;
  if (der[1] & 0x80) off += der[1] & 0x7f;         // long-form length
  const readInt = () => {
    if (der[off++] !== 0x02) throw new Error('bad DER');
    let len = der[off++];
    let val = der.subarray(off, off + len); off += len;
    while (val.length > 32 && val[0] === 0) val = val.subarray(1);   // strip pad
    const out = Buffer.alloc(32);
    val.copy(out, 32 - val.length);
    return out;
  };
  return Buffer.concat([readInt(), readInt()]);
}

function vapidHeader(endpoint) {
  const aud = new URL(endpoint).origin;
  const header = b64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const payload = b64url(JSON.stringify({
    aud,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,   // spec max is 24h
    sub: process.env.VAPID_SUBJECT || 'mailto:hello@aiwine.co.nz',
  }));
  const signing = `${header}.${payload}`;
  const pem = String(process.env.VAPID_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const der = crypto.createSign('SHA256').update(signing).sign({ key: pem, dsaEncoding: 'der' });
  return `vapid t=${signing}.${b64url(derToJose(der))}, k=${process.env.VAPID_PUBLIC_KEY}`;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-internal-key');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const sbUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !sbKey) return res.status(500).json({ error: 'server_not_configured' });
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    // Deliberate: a missing key set is a no-op, not a 500. Order recording must
    // never fail because notifications are not configured yet.
    return res.status(200).json({ ok: false, skipped: 'vapid_not_configured' });
  }

  try {
    let b = req.body;
    if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
    b = b || {};
    const wineryId = clip(b.wineryId, 80);
    const kind = ['new_order', 'low_stock', 'milestone', 'account'].includes(b.kind) ? b.kind : 'new_order';
    if (!wineryId) return res.status(400).json({ error: 'winery_required' });

    // --- Authorise: internal key, or a member of this winery ---------------
    const internal = req.headers['x-internal-key'];
    let authorised = !!(internal && process.env.PUSH_INTERNAL_KEY && internal === process.env.PUSH_INTERNAL_KEY);
    if (!authorised) {
      const authz = req.headers.authorization || '';
      const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
      if (!token) return res.status(401).json({ error: 'unauthorized' });
      const who = await fetch(`${sbUrl}/auth/v1/user`, { headers: { apikey: sbKey, Authorization: `Bearer ${token}` } });
      if (!who.ok) return res.status(401).json({ error: 'bad_session' });
      const u = await who.json();
      const memQ = await fetch(`${sbUrl}/rest/v1/winery_users?select=role&userId=eq.${encodeURIComponent(u.id)}&wineryId=eq.${encodeURIComponent(wineryId)}`,
        { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } });
      const mem = memQ.ok ? await memQ.json() : [];
      if (!mem.length) {
        // AIWine staff are not in winery_users for a winery they don't own, but
        // they must be able to send a diagnostic push while supporting one — so
        // fall back to the staff check rather than refusing outright.
        let staff = false;
        try {
          const sQ = await fetch(`${sbUrl}/rest/v1/rpc/is_staff`, {
            method: 'POST',
            headers: { apikey: sbKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: '{}',
          });
          if (sQ.ok) staff = (await sQ.json()) === true;
        } catch (e) {}
        if (!staff) return res.status(403).json({ error: 'not_a_member' });
      }
      authorised = true;
    }

    // --- Who wants this kind of alert, on which devices? -------------------
    const tQ = await fetch(`${sbUrl}/rest/v1/rpc/push_targets`, {
      method: 'POST',
      headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_winery: wineryId, p_kind: kind }),
    });
    if (!tQ.ok) return res.status(502).json({ error: 'targets_failed', detail: clip(await tQ.text(), 200) });
    const targets = await tQ.json();
    if (!targets.length) return res.status(200).json({ ok: true, sent: 0, note: 'no_devices' });

    // --- Send an empty push to each device --------------------------------
    // TTL 86400: if the phone is off in a cellar, the push service holds it for
    // a day rather than dropping it. Topic collapses repeats so ten orders in an
    // hour don't stack ten identical notifications.
    let sent = 0, failed = 0;
    await Promise.all(targets.map(async (t) => {
      try {
        const r = await fetch(t.endpoint, {
          method: 'POST',
          headers: {
            TTL: '86400',
            Urgency: kind === 'new_order' ? 'high' : 'normal',
            Topic: 'aiwine-' + kind,
            Authorization: vapidHeader(t.endpoint),
          },
        });
        if (r.ok || r.status === 201) { sent++; return; }
        failed++;
        await fetch(`${sbUrl}/rest/v1/rpc/push_mark_failure`, {
          method: 'POST',
          headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_endpoint: t.endpoint, p_error: String(r.status) }),
        }).catch(() => {});
      } catch (e) { failed++; }
    }));

    return res.status(200).json({ ok: true, kind, sent, failed });
  } catch (e) {
    return res.status(500).json({ error: 'unexpected', detail: clip(e && e.message, 300) });
  }
};

/* AIWine — Stripe webhook (Vercel serverless function).
   Deploys automatically with the portal repo at  /api/stripe-webhook
   On checkout.session.completed it flips the paid feature ON for the
   winery that paid (matched via client_reference_id = wineryId, which
   the portal appends to the Payment Link URL).

   Required environment variables (Vercel → portal project → Settings →
   Environment Variables):
     STRIPE_WEBHOOK_SECRET        whsec_...   (from the webhook endpoint)
     SUPABASE_URL                 https://<ref>.supabase.co
     SUPABASE_SERVICE_ROLE_KEY    service_role secret (Settings → API)
     STRIPE_PLINK_CELLAR_DOOR     plink_...   (Cellar Door payment link id)
     STRIPE_PLINK_GROW            plink_...   (Grow payment link id)
*/
const crypto = require('crypto');

// we must verify the signature against the RAW body
module.exports.config = { api: { bodyParser: false } };

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifyStripeSignature(raw, header, secret) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map((kv) => kv.split('=')));
  if (!parts.t || !parts.v1) return false;
  const expected = crypto.createHmac('sha256', secret)
    .update(`${parts.t}.${raw}`).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
  } catch (e) { return false; }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sbUrl = process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !sbUrl || !sbKey) { res.status(500).json({ error: 'not_configured' }); return; }

  const raw = (await rawBody(req)).toString('utf8');
  if (!verifyStripeSignature(raw, req.headers['stripe-signature'], secret)) {
    res.status(400).json({ error: 'bad_signature' }); return;
  }

  let event;
  try { event = JSON.parse(raw); } catch (e) { res.status(400).json({ error: 'bad_json' }); return; }

  // Only completed checkouts flip features on. Everything else: acknowledge.
  if (event.type !== 'checkout.session.completed') { res.status(200).json({ received: true }); return; }

  const s = event.data && event.data.object ? event.data.object : {};
  if (s.payment_status && s.payment_status !== 'paid') { res.status(200).json({ received: true, note: 'not_paid' }); return; }

  const wineryId = s.client_reference_id || null;
  const plink = s.payment_link || '';
  let feature = null;
  if (plink && plink === process.env.STRIPE_PLINK_CELLAR_DOOR) feature = 'cellarDoor';
  else if (plink && plink === process.env.STRIPE_PLINK_GROW) feature = 'grow';

  if (!wineryId || !feature) {
    // Can't match automatically — Stripe's own email covers manual follow-up.
    console.warn('stripe-webhook: unmatched session', { wineryId, plink, session: s.id });
    res.status(200).json({ received: true, note: 'unmatched — activate manually' });
    return;
  }

  const patch = feature === 'grow'
    ? { growActive: true, planActivatedVia: 'stripe' }
    : { cellarDoorActive: true, planActivatedVia: 'stripe' };

  const r = await fetch(`${sbUrl.replace(/\/+$/, '')}/rest/v1/wineries?id=eq.${encodeURIComponent(wineryId)}`, {
    method: 'PATCH',
    headers: {
      apikey: sbKey,
      Authorization: `Bearer ${sbKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  });
  if (!r.ok) {
    console.error('stripe-webhook: supabase update failed', r.status, await r.text());
    res.status(500).json({ error: 'db_update_failed' }); return;   // Stripe will retry
  }
  console.log('stripe-webhook: activated', feature, 'for winery', wineryId);
  res.status(200).json({ received: true, activated: feature, wineryId });
};

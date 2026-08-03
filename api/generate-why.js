// AIWine — generate the "why you'll like it" line for wines, with AI.
// ---------------------------------------------------------------------------
// Populates wines.why for any wine that doesn't have one yet, so wineries never
// fill it in. Grounded ONLY in the wine's own stored data (name, winery, variety,
// region, style, tasting notes, pairings) — it never invents facts or prices.
//
// Deploy as a Vercel serverless function in the portal project (same repo as
// stripe-webhook.js). Trigger it:
//   • manually:  GET https://portal.aiwine.co.nz/api/generate-why?key=GENERATE_WHY_SECRET
//   • on a schedule: a Vercel Cron (vercel.json) hits this path every 15 min.
//   • one wine:  ...&id=<wineId>   (regenerate a single wine)
//   • overwrite: ...&force=1       (redo even wines that already have a why)
//   • include demo rows: ...&demo=1 (default SKIPS demo/seed wines)
//
// Only REAL winery wines are processed by default: demo/seed catalogue rows have
// no `created_by`, whereas every genuine upload stamps it — so we never spend AI
// budget on throwaway demo data, and new winery uploads get a why automatically.
//
// ENV (Vercel project settings — NEVER in any config.js):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (service role: server-only writes)
//   ANTHROPIC_API_KEY
//   GENERATE_WHY_SECRET                        (shared secret to gate the endpoint)
// ---------------------------------------------------------------------------

const MODEL = 'claude-3-5-haiku-latest';   // small, cheap, plenty for a one-liner
const BATCH = 40;                          // wines per invocation (stay within limits)
const MAX_WORDS = 18;

async function sb(path, { method = 'GET', body, query = '' } = {}) {
  const url = `${process.env.SUPABASE_URL}/rest/v1/${path}${query}`;
  const res = await fetch(url, {
    method,
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'PATCH' ? 'return=minimal' : 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${path} → ${res.status} ${await res.text()}`);
  return method === 'PATCH' ? null : res.json();
}

// Ask the model for ONE short, personal reason grounded in this wine's data.
async function whyForWine(w) {
  const facts = [
    w.name && `Name: ${w.name}`,
    w.winery && `Winery: ${w.winery}`,
    w.variety && `Variety: ${w.variety}`,
    w.region && `Region: ${w.region}`,
    w.style && `Style: ${w.style}`,
    w.organic && `Organic: yes`,
    w.notes && `Tasting notes: ${w.notes}`,
    Array.isArray(w.pairings) && w.pairings.length && `Pairs with: ${w.pairings.join(', ')}`,
  ].filter(Boolean).join('\n');

  const prompt = `You write one short line for a New Zealand wine shop that tells a shopper WHY they'll enjoy this wine — a warm, specific hook, NOT a repeat of the tasting note.
Rules:
- Max ${MAX_WORDS} words, one sentence, no wine name, no price, no emoji, no quotes.
- Ground it ONLY in the facts below. Do not invent awards, scores, or flavours not implied.
- Speak to the shopper ("Perfect if you love...", "Made for slow Sunday roasts...").

FACTS:
${facts}

Return ONLY the sentence.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: 60, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status} ${await res.text()}`);
  const data = await res.json();
  let line = (data.content && data.content[0] && data.content[0].text || '').trim().replace(/^["']|["']$/g, '');
  // hard cap the word count as a backstop
  const words = line.split(/\s+/);
  if (words.length > MAX_WORDS) line = words.slice(0, MAX_WORDS).join(' ');
  return line;
}

module.exports = async (req, res) => {
  try {
    const q = req.query || {};
    // Authorized if: manual call with the right &key, OR it's Vercel Cron
    // (Vercel sets the x-vercel-cron header on scheduled invocations).
    const isCron = !!(req.headers && req.headers['x-vercel-cron']);
    if (!isCron && q.key !== process.env.GENERATE_WHY_SECRET) return res.status(401).json({ error: 'unauthorized' });

    const force = q.force === '1';
    const includeDemo = q.demo === '1';
    // Real wines only (default): created_by is set on genuine winery uploads,
    // null on the demo/seed catalogue. `&demo=1` overrides to include everything.
    const realOnly = includeDemo ? '' : '&created_by=not.is.null';
    let filter;
    if (q.id) filter = `?id=eq.${encodeURIComponent(q.id)}&select=*`;
    else if (force) filter = `?select=*${realOnly}&limit=${BATCH}`;
    else filter = `?select=*&or=(why.is.null,why.eq.)${realOnly}&limit=${BATCH}`;   // missing why, real wines

    const wines = await sb('wines', { query: filter });
    let done = 0, failed = 0;
    for (const w of wines) {
      if (!force && !q.id && w.why) continue;
      try {
        const why = await whyForWine(w);
        if (why) { await sb('wines', { method: 'PATCH', query: `?id=eq.${w.id}`, body: { why } }); done++; }
      } catch (e) { failed++; }
    }
    res.status(200).json({ scanned: wines.length, written: done, failed, note: 'run again to continue if scanned === batch' });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};

// AIWine Winery Portal — the in-portal AI help assistant ("Vine").
// ---------------------------------------------------------------------------
// Powers the floating Help button in the portal. The browser POSTs the running
// conversation + a little context (which screen the winery is on, their winery
// name/region/plan) and this returns the assistant's next reply. Grounded ONLY
// in how the portal actually works (onboarding → wine management), so it guides
// wineries instead of inventing features.
//
// Deploy as a Vercel serverless function in the portal project (same repo as
// generate-why.js / stripe-webhook.js). The browser calls  POST /api/help-chat.
//
// ENV (Vercel project settings — NEVER in any config.js):
//   ANTHROPIC_API_KEY
// ---------------------------------------------------------------------------

const MODEL = 'claude-3-5-haiku-latest';   // the model this account has access to; upgrade once Sonnet is enabled in the Anthropic console
const MAX_TOKENS = 700;
const MAX_TURNS = 16;                       // last N messages kept as context

// What "Vine" knows about the portal. Kept in sync with ONBOARDING.md and the
// portal's own screens (the nav in portal.js). Facts only — no invented pricing.
const SYSTEM = `You are "Vine", the friendly AI assistant built into the AIWine Winery Portal. You help New Zealand wineries run their AIWine store — from first sign-up all the way through to day-to-day wine management. You are speaking to a winery owner or their staff inside the portal.

VOICE
- Warm, plain-spoken, and brief. Kiwi-friendly, never salesy or robotic.
- Answer the actual question first, then (if useful) one short next step.
- Prefer 2–5 short sentences or a tight bullet list. Never a wall of text.
- Use the winery's name naturally when you know it. You may use light markdown: **bold** for the key action and "- " bullets for steps.
- If you genuinely don't know something portal-specific, say so and point them to partners@aiwine.co.nz. Never invent features, prices, dates, or data about their specific wines/orders (you can't see their live data).

WHAT AIWINE IS
AIWine is where wine lovers discover, scan and buy New Zealand wine, with an AI sommelier that recommends wines to shoppers. A winery's free portal lets them manage their range, prices, stock, images and orders — and their wines appear on aiwine.co.nz.

ONBOARDING (getting started)
1. **Create your winery account** at portal.aiwine.co.nz — email, password, winery name, region, and optional website.
2. **Confirm your email** (click the link in the inbox), then sign in.
3. You'll see an **Awaiting approval** screen — the AIWine team reviews and approves the winery, usually within a business day, and emails when it's ready. No codes are needed.
4. Once approved, sign in and land on your **Dashboard**.
5. Go to **Upload list** and add your range — your wines go live on AIWine.
There is a getting-started checklist on the Dashboard that walks through these steps.

THE PORTAL SCREENS (what each does)
- **Dashboard** — overview: stock alerts, recent orders, revenue, and the getting-started checklist.
- **Orders** — new / packing / shipped. Mark orders as packing then shipped. New orders are emailed to the winery the moment they land (address set in Store settings).
- **My Wines** — your range. Edit price and stock inline, add or edit a wine, and set your **fulfilment profile**. AIWine auto-writes a short "why you'll like it" line for each wine from its own details, so you never have to.
- **Payments** — everything AIWine has paid you and the paperwork. Optionally enable Stripe Connect so your share of each sale lands in your own Stripe account at the moment the customer pays.
- **Upload list** — bulk add/update your range from a CSV or the AIWine Excel template. Matching wines update; new ones are added. This is the fastest way to publish or refresh a whole range.
- **Wine images** — upload a bottle photo per wine so it looks its best on AIWine.
- **Store settings** — order-notification email and your **fulfilment profile**.
- **Plans & Cellar Door** — upgrade options (Virtual Cellar Door, Grow). Free to list stays free.
- **Insights** — how your wines are performing.
- **Integrations** — connect other tools.
- **Winery app** — the AIWine winery phone app shares the same login and data; on the phone you can quick-edit any wine's price and stock. Bulk CSV/Excel upload stays in the web portal.

FULFILMENT PROFILE (a common question)
On My Wines / Store settings you choose how customers can buy:
- **Any quantity** — customers buy 1+ bottles; $12 delivery under six bottles, free on a Discovery Six.
- **Sixes & twelves only** — you pack full cartons only; the cart requires multiples of six and the AI sommelier helps the customer complete each carton.

GROUND RULES
- You cannot see or change the winery's live wines, orders, or payouts — guide them to the right screen to do it themselves.
- For pricing of paid plans or anything you're unsure of, direct them to the Plans page or partners@aiwine.co.nz rather than guessing.
- Keep replies focused on using the portal well.`;

function buildSystem(ctx = {}) {
  const bits = [SYSTEM];
  const here = [];
  if (ctx.wineryName) here.push(`Winery: ${ctx.wineryName}`);
  if (ctx.region) here.push(`Region: ${ctx.region}`);
  if (ctx.screen) here.push(`Currently viewing the "${ctx.screen}" screen`);
  if (ctx.mode) here.push(`Mode: ${ctx.mode}`);
  if (ctx.plan) here.push(`Plan: ${ctx.plan}`);
  if (here.length) bits.push(`\nCURRENT SESSION\n${here.join('\n')}\nTailor your answer to where they are when it helps.`);
  return bits.join('\n');
}

module.exports = async (req, res) => {
  // Basic CORS/preflight so the portal can call this from its own origin.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'not_configured', reply: 'The help assistant isn’t switched on yet — please email partners@aiwine.co.nz and we’ll help you directly.' });
  }

  try {
    // Vercel usually parses JSON into req.body; fall back to reading the stream.
    let body = req.body;
    if (!body || typeof body === 'string') {
      const raw = typeof body === 'string' ? body : await new Promise((resolve) => {
        let d = ''; req.on('data', c => (d += c)); req.on('end', () => resolve(d));
      });
      body = raw ? JSON.parse(raw) : {};
    }

    const ctx = body.context || {};
    // Keep only valid user/assistant turns, cap the length, coerce to strings.
    const messages = (Array.isArray(body.messages) ? body.messages : [])
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .slice(-MAX_TURNS)
      .map(m => ({ role: m.role, content: m.content.slice(0, 4000) }));

    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'no_user_message' });
    }

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: buildSystem(ctx),
        messages,
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      return res.status(502).json({ error: 'upstream', reply: 'Sorry — I couldn’t reach the assistant just then. Please try again, or email partners@aiwine.co.nz.', detail: detail.slice(0, 300) });
    }

    const data = await resp.json();
    const reply = (data.content && data.content[0] && data.content[0].text || '').trim();
    return res.status(200).json({ reply: reply || 'Sorry — I didn’t catch that. Could you rephrase?' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e), reply: 'Something went wrong on my end. Please try again in a moment.' });
  }
};

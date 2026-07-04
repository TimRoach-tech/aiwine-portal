# Stripe webhook + automatic activation — complete update (do in order)

Payment is now fully automatic: winery clicks Subscribe → Stripe card checkout
→ webhook flips the feature on for that winery → they click "Just paid? Check
activation" (or reload) and it's live. Activation codes (WAIRARAPA, FOUNDING49)
are now real too — stored in the database, usage-counted, per-winery.

═══════════════════════════════════════════════════════════
STEP 1 — Database (Supabase → SQL Editor)
═══════════════════════════════════════════════════════════
Run the CONTENTS of each file (from the portal zip, supabase/ folder), in order.
All safe to re-run. Skip any you have already run.
  1. supabase/03-multi-winery.sql
  2. supabase/04-orders-email.sql
  3. supabase/05-plan-activation.sql      ← NEW

Verify (expect 6 rows):
    select proname from pg_proc where proname in
      ('is_my_winery','grant_winery_access','revoke_winery_access',
       'set_orders_email','redeem_activation_code','my_winery');

═══════════════════════════════════════════════════════════
STEP 2 — Stripe setup (10 min, no code)
═══════════════════════════════════════════════════════════
1. stripe.com → your AIWine account (NZ, NZD).
2. Product catalogue → Add product ×2:
   · "AIWine Virtual Cellar Door" — $95.00 NZD, recurring yearly
   · "AIWine Grow" — $95.00 NZD, recurring yearly
3. Payment Links → New, one per product. Note BOTH things for each:
   · the URL        (https://buy.stripe.com/xxxx)   → goes in config.js
   · the LINK ID    (plink_xxxx — shown in the dashboard address bar
                     when you open the payment link)  → goes in Vercel env
4. Developers → Webhooks → Add endpoint:
   · URL:    https://portal.aiwine.co.nz/api/stripe-webhook
   · Events: select just  checkout.session.completed
   · After saving, copy the Signing secret (whsec_...)

═══════════════════════════════════════════════════════════
STEP 3 — Vercel environment variables (portal project)
═══════════════════════════════════════════════════════════
Vercel → aiwine-portal project → Settings → Environment Variables → add:
    STRIPE_WEBHOOK_SECRET       whsec_...          (from step 2.4)
    SUPABASE_URL                https://rabysewpavsakveuufjr.supabase.co
    SUPABASE_SERVICE_ROLE_KEY   (Supabase → Project Settings → API →
                                 service_role — SECRET, never in config.js)
    STRIPE_PLINK_CELLAR_DOOR    plink_...          (Cellar Door link id)
    STRIPE_PLINK_GROW           plink_...          (Grow link id)

═══════════════════════════════════════════════════════════
STEP 4 — Update the aiwine-portal repo
═══════════════════════════════════════════════════════════
1. Edit config.js FIRST: paste your two payment-link URLs into STRIPE_LINKS.
2. Upload to the repo (replace existing / add new):
     config.js  ·  portal.js  ·  store.js
     api/stripe-webhook.js                ← NEW folder "api"
     supabase/03 + 04 + 05 (for the record)
3. Commit → Vercel redeploys (env vars from step 3 apply on this deploy).

═══════════════════════════════════════════════════════════
STEP 5 — Update the website repo (phone app)
═══════════════════════════════════════════════════════════
Upload into apps/winery/ (replace): store.js · config.js · winery.js · sw.js

═══════════════════════════════════════════════════════════
STEP 6 — Test the whole payment loop (5 min)
═══════════════════════════════════════════════════════════
1. Stripe → toggle TEST MODE, create a test payment link the same way OR
   use live mode with your own card (you can refund yourself).
2. Portal → sign in as The Three Chimneys → Plans & Cellar Door → Subscribe
   → pay (test card 4242 4242 4242 4242 in test mode) → back in the portal
   click "Just paid? Check activation" → the cellar-door editor appears.
3. Codes: on a second winery, enter WAIRARAPA → activates instantly, and
   the code's use is counted (select code, uses from activation_codes;).
4. Stripe → Webhooks → your endpoint → check the event shows "Succeeded".

═══════════════════════════════════════════════════════════
Troubleshooting
═══════════════════════════════════════════════════════════
· Webhook shows 400 bad_signature → STRIPE_WEBHOOK_SECRET wrong/missing.
· Webhook 200 but "unmatched" → plink env vars don't match the payment link,
  or the winery paid via a bare link (no client_reference_id). Activate
  manually:  update wineries set "cellarDoorActive"=true where id='<id>';
· Paid but portal still gated → click "Just paid? Check activation" or
  hard-refresh; check the webhook event in Stripe for errors.
· Test-mode payments need a TEST-mode webhook endpoint + secret too.

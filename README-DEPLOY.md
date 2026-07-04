# Portal upload — 5 July 2026

## What's in this update
1. **Grow pages fix** — Plans & Cellar Door + Winery app screens were blank
   (missing containers); router made fail-safe
2. **Winery switcher** — dark in-keeping design (replaces the blue one)
3. **Mobile polish** — taller touch targets, responsive page heads/stats/
   modals, sidebar drawer closes via scrim tap, tidier topbar on phones
4. Stripe payment-link wiring in config.js (add your links under STRIPE_LINKS)

## Deploy
1. If not already run: Supabase → supabase/03-multi-winery.sql then
   04-orders-email.sql
2. Upload to the aiwine-portal repo (replace existing):
   - portal.js
   - portal.css
   - store.js
   - config.js   (⚠️ merge your real STRIPE_LINKS / keys — don't blindly
     overwrite if your deployed config has live values)
3. Vercel auto-redeploys.

## Smoke test (phone)
- Menu button opens/closes the sidebar; tapping outside closes it
- Plans & Cellar Door, Insights, Integrations, Winery app all show content
- Multi-winery login: switcher is dark claret style, not blue

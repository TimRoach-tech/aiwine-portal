# Portal update — 2026-07-13  (WAIRARAPA26 code + duplicate-account message)

Deploys via **GitHub → Vercel**. Drag-drop / commit these into the portal repo
(same paths), then redeploy. Plus ONE SQL to run in Supabase.

## SQL (run first, in Supabase → SQL Editor)
- `supabase/08-add-wairarapa26-code.sql` — adds the **WAIRARAPA26** founding code
  (the launch email uses it; only `WAIRARAPA` existed before). Additive +
  idempotent; `WAIRARAPA` keeps working.

## Files
- `portal.js` — demo-mode code list now also accepts `WAIRARAPA26` (keeps the
  portal's demo/preview consistent with live).
- `store.js` — winery signup now detects an already-registered email (Supabase
  returns a fake-success when Confirm email is on) and shows a "please sign in"
  message instead of a false "check your inbox".

## Test after deploy
1. Run the SQL; confirm `select code from activation_codes;` lists WAIRARAPA26.
2. In the portal (a real, approved winery login) → Plans & Cellar Door →
   enter `WAIRARAPA26` → Apply → Virtual Cellar Door activates.
3. Try signing up again with an existing email → "already exists, sign in".

# AIWine Winery Portal — GO-LIVE

Status as of the last connection check: **the backend is ready.** Anon key works,
migrations 01 / 05 / 07 are all live, auth is configured (sign-ups on, email
auto-confirm on). Two things stand between you and a live winery sign-in. Do them
in order.

Re-run **`connection-check.html`** anytime to re-confirm the backend — especially
after rotating a key or pointing it at the live domain.

---

## ① The two-winery RLS test  ← the one real gate (do this first)

A diagnostic can't verify this — row-level security exists precisely so that an
anonymous probe *can't* see through it. You have to prove isolation with two real
logins. If data leaks between wineries, **stop and fix RLS before deploying.**

1. Open the portal (locally is fine) and **sign up two test wineries**:
   - Winery **A** — e.g. "Test Estate A", login `a@example.com`
   - Winery **B** — e.g. "Test Estate B", login `b@example.com`
2. Signed in as **A**, add a wine ("A Pinot Noir") and note the stock/orders shown.
3. Sign out. Sign in as **B**. Add a different wine ("B Syrah").
4. **The test:** as **B**, you must see **only** B's wine — zero sign of "A Pinot
   Noir", zero of A's orders. Then sign back in as **A** and confirm the reverse.
5. ✅ Each winery sees only its own rows → RLS is correct, proceed.
   ❌ Either winery sees the other's data → **do not deploy.** The leak is in the
   RLS policies (migration 01 / 05). Fix `using (wineryId = my_winery())` on
   `wines` and `orders` so it returns only the caller's winery.
6. Clean up the two test wineries when done (delete their rows / auth users).

---

## ② Deploy the folder

The `portal/` folder is now **self-contained** (favicon copied in, all paths
relative) — it deploys as-is.

1. **Vercel** — new project, root = this `portal/` folder, domain
   `portal.aiwine.co.nz`. Same stack as the CRM.
2. **Cloudflare DNS** — `portal` CNAME → `cname.vercel-dns.com` (grey cloud),
   then add the domain in the Vercel project. Exactly like `crm.aiwine.co.nz`.
3. **Supabase Auth → URL config** — add the live origin
   `https://portal.aiwine.co.nz` to **Site URL** and **Redirect URLs**. Without
   this, password-reset and recovery links point at the wrong place.
4. **Smoke test on the live domain:** open `connection-check.html` there (all
   green), then sign up one real winery and sign back in. Delete the test winery.

Live. 🍷

---

## Reference — what each migration provides (all confirmed live)

| File | Gives you | Portal breaks without it… |
|------|-----------|---------------------------|
| `supabase/01-portal-schema.sql` | `winery_users`, `my_winery()`, `orders` + per-winery RLS | …can't scope any data to a winery |
| `site-deploy/.../05-winery-portal-access.sql` | self-onboard trigger, per-tenant winery row, anon listing grant | …sign-up fails; public listings blank |
| `site-deploy/.../07-multisite-and-order-email.sql` | `my_wineries()`, `add_site()`, `place_order()`, order email | …loads login then **crashes** on `loadSites()` |

## The surfaces this connects to
- **wineries.aiwine.co.nz** (marketing) → "Log in" → **this portal**
- **winery app** (`apps/winery/`) — phone companion, same login + data
- **crm.aiwine.co.nz** — your staff view of the same database

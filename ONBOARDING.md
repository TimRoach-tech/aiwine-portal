# AIWine Winery Portal — going live & onboarding wineries

The portal is **live** (`portal/config.js` points at the production Supabase
project — the same database as the CRM and the consumer site). Wineries
**register themselves** in the portal; your team **approves** each one from the
CRM. No codes, no per-winery setup, works for any winery from any association.

Verified operational (July 2026):

- Auth reaches Supabase; bad logins are rejected cleanly.
- `wines`, `orders`, `order_items`, `winery_users`, `wineries` exist with
  Row-Level Security enabled; `my_winery()` and `is_staff()` helpers exist.
- Portal boots to sign-in, has a **Create your winery account** flow, and every
  action once approved — stock/price edits, add wine, orders, and bulk CSV/Excel
  upload — writes through to Supabase.

---

## A. One-time setup

### 1. Turn on email verification  ← required
Supabase → **Authentication → Sign In / Providers → Email**:
- **Confirm email = ON** — new signups must click a link in their inbox before
  they can sign in. (Applies to the consumer site too.)
- **URL Configuration** → set Site URL + Redirect URLs to `https://portal.aiwine.co.nz`
  so confirmation / reset links land back on the portal.
- Optional: brand the **Confirm signup** email template.

### 2. Run the schema migrations (in order, SQL Editor)
1. the CRM schema (creates `wineries`, `wines`, `is_staff()`)
2. `portal/supabase/01-portal-schema.sql` (`winery_users`, `orders`,
   `order_items`, `my_winery()`, per-winery RLS)
3. **`portal/supabase/02-winery-signup-approval.sql`** — the self-signup queue:
   `winery_signup_requests` + the secure `request_winery_access()`,
   `approve_winery_request()`, `reject_winery_request()` functions.

### 3. Confirm your CRM staff logins are recognised by `is_staff()`
Approving happens in the CRM, so the person approving must be staff. (This is the
same `is_staff()` your CRM already uses — no extra step if you can log into the
CRM against live data.)

---

## B. How it works (no per-winery action)

```
Winery                                  You (CRM)
──────                                  ─────────
Create your winery account
  (email, password, winery name,
   region, website)
      │
      ▼
Confirm email  ──►  sign in
      │
      ▼
"Awaiting approval"  ───────────────►   Winery signups → Pending
                                              │
                        Approve  ◄────────────┘  (creates/links the
                              │                    winery + grants access)
      ┌───────────────────────┘
      ▼
Sign in → dashboard → Upload list → publish range
```

- A winery signs up and is guided to verify their email, then their winery is
  submitted for review automatically. They see an **Awaiting approval** screen.
- You review it in the CRM under **Winery signups** (the sidebar shows a count of
  pending requests). **Approve** creates the winery record (or links to an
  existing one of the same name) and grants portal access; **Decline** lets them
  update their details and re-apply.
- Once approved, the winery signs in and lands on their dashboard, where they
  upload their range (CSV or Excel) — matching wines update, new ones are added.

Security: a winery can only ever read/submit **their own** request and can never
write a winery→login mapping directly. The mapping is created only by
`approve_winery_request()`, which is staff-gated — so open registration never
lets one winery reach another's data. RLS enforces this regardless of the UI.

---

## C. Operational test (run once before launch)

1. In the portal, **Create your winery account** with a throwaway email +
   `Test Winery` → confirm the email → sign in → you should see **Awaiting
   approval**.
2. In the CRM → **Winery signups**, the request shows under **Pending**. Click
   **Approve**.
3. Back in the portal, sign in again → you land on an **empty** dashboard branded
   `Test Winery` (not another winery's data).
4. **Upload list** → template with 2–3 rows → Confirm → they appear in **Table
   Editor → `wines`** with the new winery's `wineryId`.
5. **Isolation test:** register a *second* test winery, approve it, sign in, and
   confirm you **cannot** see the first winery's wines/orders. As that login in
   the SQL Editor:
   ```sql
   select my_winery();          -- your wineryId, not null
   select count(*) from wines;  -- ONLY your wines
   select count(*) from orders; -- ONLY your orders
   ```
6. Clean up the test wineries / users when done.

---

## D. Email copy for the association to send

The association just needs to point wineries at the portal — no codes to
distribute, so the same message works for every winery and every association:

> **Subject: List your wines on AIWine — free winery portal**
>
> Kia ora,
>
> AIWine is where wine lovers discover, scan and buy New Zealand wine, with an AI
> sommelier that recommends your wines. Your free winery portal lets you manage
> your range, prices, stock and orders.
>
> To get started:
> 1. Go to **portal.aiwine.co.nz** and click **Create your winery account**.
> 2. Enter your email, choose a password, and tell us your winery name and region.
> 3. Confirm your email. We'll review and approve your winery (usually within a
>    business day) and email you when it's ready.
> 4. Sign in, go to **Upload list**, and add your range — your wines go live on
>    AIWine.
>
> Free to list. Questions: partners@aiwine.co.nz

---

## E. Notes
- **Approve from the CRM**, day to day: **Winery signups** in the sidebar. The
  SQL equivalents (`select approve_winery_request('<userId>')`, etc.) are in
  migration 02 if you ever need them.
- Approving auto-creates a `wineries` row (`tier=listed`, `status=onboarding`) if
  no existing winery matches the name — so wineries you *haven't* pre-loaded in
  the CRM still work. If you have pre-created the record, pass its id:
  `select approve_winery_request('<userId>', '<wineryId>')`.
- The anon/publishable key in `config.js` is browser-safe: RLS protects the data.
- The winery phone app (`apps/winery/`) now shares these exact logins and data
  — it ships with its own `config.js` + data layer pointing at the same Supabase
  project, so a winery signs up / is approved once and can sign in on web **and**
  phone. On the phone they can quick-edit any wine's price and stock; bulk
  CSV/Excel upload stays in the web portal.

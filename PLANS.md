# AIWine — winery plans & pricing (PORTAL-ONLY — never shown to consumers)

All pricing and activation lives **behind the portal login**. Consumer-facing pages
only ever show the *result* (a basic vs rich winery profile + the 🍷 "Cellar Door"
directory pill). No prices, codes, or upsell numbers appear on aiwine.co.nz.

## Plans

### 1. Standard — Free (everyone)
- Free portal access
- Free, unlimited wine uploads (CSV/Excel + Add-wine form)
- Public winery profile — **basic tier** (name, region, their wines)
- Appears in the A–Z regional directory
- No insights, no integrations

### 2. Virtual Cellar Door — $95 / year
- Everything in Standard, plus:
- **Rich winery profile** — hero photo, story, visit/cellar-door details, founding badge
- **🍷 "Cellar Door" pill** + prominence in the directory
- Self-managed in the portal (story, photo, hours)
- **Founding rate: $49 for the first year** (via activation code), first year only; reverts to $95/yr after.

### 3. Grow (Portal/App) — $95 / year
- **Your own (local) winery data is always FREE** — scans, most-scanned wines, the
  Sommelier asks that found you, orders. No subscription needed.
- Grow adds the **Regional** and **National** insight scopes (aggregated &amp;
  anonymised demand signals) **+ Integrations** (API / EPOS sync, winery app).
- Unlocked in the portal; **not available on the free tier** (locked, not shown)
- Stackable with Virtual Cellar Door.

## Activation codes (issued via CRM, redeemed in portal)

| Code type | Unlocks | Price | Validity |
|---|---|---|---|
| **Founding** | Virtual Cellar Door | **$49** first year (then $95/yr) | First year only |
| **Wairarapa Association** | Virtual Cellar Door | **Free** | Short window — **1 month prior to launch** only (expiry-dated) |

- Codes are generated/tracked in the CRM (who was invited, who activated, revenue).
- The Wairarapa code is time-limited: valid only for ~1 month before launch, then expires.

## How wineries pay
- **Stripe** (recommended) — card payment, annual auto-renew, handles NZ GST,
  receipts, retries, renewals. A serverless endpoint creates the Checkout session;
  a webhook flips the winery's plan flag in Supabase (same stack as CRM/portal).
- **Activation codes work with Stripe:** a code either **discounts** the price
  (Founding → Stripe coupon $95→$49) or **fully comps** it (Wairarapa → no checkout).
- **Invoice / bank transfer** — optional manual path for card-averse wineries: you
  mark them paid in the CRM and issue a code. More admin; useful for the association.
- (No PayPal/POLi needed if Stripe is in place. Xero reconciles Stripe automatically.)

## How it flows
```
CRM issues code  →  winery logs into portal  →  "Activate Virtual Cellar Door"
  →  enters code (or pays $95 / $49)  →  editor unlocks  →  public profile flips to
     the rich tier + 🍷 pill in directories
```

## Build notes (when implemented)
- Portal: a **Cellar Door** section — activation gate (code/price) + self-service
  editor (story, photo, visit hours), writing to the winery record / `cellar-doors`
  flag (DB-driven, replacing the hand-edited assets/cellar-doors.js at go-live).
- Portal: a **Grow** unlock gating the Insights + Integrations tabs.
- CRM: code generation + redemption tracking; comp/expiry control.
- Public site: unchanged except it reads the cellar-door flag from data (already wired
  via assets/cellar-doors.js → becomes a DB field).

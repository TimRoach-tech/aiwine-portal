# ⚠️ PAYMENT-PHASE TODO — carry gift + delivery method into the live order

When the checkout **payment phase** is built (Stripe → write the order to the
Supabase `orders` table), the insert MUST include these two fields that are
already captured on the order object today:

- `order.gifts`            → column `orders.gifts`  (jsonb)   — per-winery { wrap, message }
- `order.delivery.method`  → column `orders.method` (text)    — 'deliver' | 'pickup'

Both columns already exist (added by `portal/supabase/13-store-settings.sql`).
The portal Orders screen already reads and displays them (`normOrder` +
`orderRow` gift/pickup tags). Until the live insert carries them, live orders
will show blank tags — demo orders are seeded so the display is verifiable.

Where it's set on the website:
- `checkout.html submit()` builds `AIWine.buildOrder({ delivery: addr, gifts, status })`.
- Order is stashed in `sessionStorage 'aiwine:pending-order'` and passed to
  `checkout-payment.html`.
- The live-order INSERT (to be written in the payment phase) reads that pending
  order — just map `gifts` and `delivery.method` onto the row.

Cross-refs: `portal/supabase/13-store-settings.md`, `portal/store.js normOrder`,
`site-*/assets/app.js buildOrder`.

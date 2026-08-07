# Checkout re-price + commission — go-live draft

**Status: DRAFT, not wired in.** The on-site cart is gated until go-live
(`Stripe ENABLED = false`). This is the server price authority to switch on with
the cart. It commits nothing until you uncomment the Stripe block and set the env.

## Why this exists
The browser must never decide what to charge. Today the client (`app.js`) computes
the cart total for display; at go-live the **server** must recompute it from the
database so a tampered browser can't change the price or the commission.

## Files
- **`_pricing.js`** — pure re-price function (no I/O). Mirrors the client math in
  `site-*/assets/app.js` (grouping, dozen/app discounts, postage, inclusive GST) and
  adds the **commission snapshot** (20% of wine value + GST on commission). Unit-testable.
- **`checkout-reprice.js`** — Vercel serverless endpoint (`/api/checkout-reprice`).
  Fetches live `price`/`stock` (+ per-winery store settings) from Supabase with the
  service-role key, calls `_pricing.reprice()`, returns the authoritative order and
  the amount Stripe should charge. Stripe session creation is stubbed (TODO) so it
  reviews cleanly now.

## Request / response
POST JSON:
```json
{ "lines": [{ "id": "w05", "qty": 6 }],
  "groups": { "Brand A": "Group X" },
  "member": false,
  "delivery": { "method": "deliver" },
  "clientTotal": 168 }
```
200 → `{ ok, order, clientMismatch }`. `order.amountCents` is what Stripe charges;
`order.commission` is the per-order snapshot. 409 → a stock / min-order / paused
problem (client should re-sync the cart and show the reason). The **server value
always wins**; `clientMismatch` is just a signal to log/alert.

## Wiring it at go-live (checklist)
1. Set env in the portal Vercel project: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `STRIPE_SECRET_KEY` (`sk_live_…`), `CHECKOUT_ALLOW_ORIGIN=https://www.aiwine.co.nz`.
2. `npm i stripe` in the portal repo; uncomment the Stripe block in `checkout-reprice.js`.
3. Point `checkout-payment.html` at `/api/checkout-reprice` — post the cart lines
   (not prices), redirect to the returned `checkoutUrl`.
4. Extend `stripe-webhook.js` to, on `checkout.session.completed`, write the order +
   **commission snapshot** and **decrement stock**, idempotent on session id — and
   carry `order.gifts` (jsonb) + `order.delivery.method` (see `PAYMENT-PHASE-TODO.md`).
5. Move the `groups` brand→group map from site config into the DB so client and
   server share one source.

## ⚠ Keep in sync
`_pricing.js` duplicates the cart math from `assets/app.js`. If you change thresholds,
discounts, postage, GST, or the group map in one, change the other. A drift means the
displayed total and the charged total disagree.

## Test the math now (no deploy)
```js
const { reprice } = require('./_pricing');
console.log(reprice({
  lines: [{ id: 'w05', qty: 6 }],
  wines: { w05: { price: 28, stock: 24, winery: 'Ata Rangi', name: 'Crimson', region: 'Martinborough' } },
  settings: { 'Ata Rangi': { freeThreshold: 6, dozenOn: false } },
}).order);
// → free delivery at 6 bottles, GST inclusive, commission = 20% of $168 + GST.
```

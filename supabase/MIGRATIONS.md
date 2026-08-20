# AIWine — Supabase migrations manifest

**Why this file exists.** There are 30+ migration files with duplicate prefixes
(two `12-`, four `13-`, two `14-`, two `16-`) and, until now, nothing recording
what had been applied. Each file is individually idempotent, but the *order*
between same-numbered files was undefined and several later files redefine
functions created earlier. That meant rebuilding the database from scratch —
after an incident, or to clone staging — was not reliably reproducible.

Files are deliberately **not renamed**: production has already run them, and
several are one-off data fixes that must never run twice. This manifest plus
`schema_migrations` gives us reproducibility without rewriting history.

---

## First-time setup on an existing database

```
00-schema-migrations.sql      -- tracking table + record_migration()
27-backfill-migration-log.sql -- record what production already has
```

Then, going forward, every new migration ends with:

```sql
select public.record_migration('28-my-change', 'schema', 'what it does');
```

Check state any time:

```sql
select version, kind, applied_at from schema_migrations order by kind, version;
```

---

## Rebuild sequence (empty database → current schema)

Run **in this order**. Duplicate-prefix ordering is resolved here — it is not
alphabetical, and getting `12-` the wrong way round leaves a broken approve RPC.

| # | File | Notes |
|---|---|---|
| 1 | `00-schema-migrations.sql` | tracking first, so everything else logs itself |
| 2 | `01-portal-schema.sql` | `winery_users`, `orders`, `order_items`, core RLS. **Also the source of `wines."wineryId"`** |
| 3 | `02-winery-signup-approval.sql` | signup queue + approval |
| 4 | `03-multi-winery.sql` | one login → many wineries |
| 5 | `04-orders-email.sql` | order notification email |
| 6 | `05-plan-activation.sql` | plan activation flags |
| 7 | `06-fulfilment.sql` | fulfilment profile |
| 8 | `10-public-winery-directory.sql` | public directory read |
| 9 | **`12-fix-approve-conflict.sql`** | **must run BEFORE `12-rls-tighten`** |
| 10 | **`12-rls-tighten.sql`** | RLS tighten from the `11-` audit |
| 11 | `13-store-settings.sql` | per-winery store settings + `set_store_settings` |
| 12 | `13b-store-settings-reload.sql` | reload path |
| 13 | `13c-wineries-grant.sql` | grants |
| 14 | `13d-volume-tiers.sql` | volume tiers |
| 15 | `14-wineries-public-read.sql` | wineries public read |
| 16 | `14-wine-provenance.sql` | created/updated by+at on wines |
| 17 | `15-wine-why.sql` | `wines.why` |
| 18 | `16-cellar-door.sql` | virtual cellar door fields |
| 19 | `16-dedupe-wines-policies.sql` | de-duplicate wines policies |
| 20 | `17-wine-images.sql` | `image_url` + `wine-images` bucket |
| 21 | `18-membership-promos.sql` | `profiles.member` + `promo_codes` |
| 22 | `21-multi-request-signups.sql` | requests keyed `(userId, wineryName)`. **Redefines `approve_winery_request` — must come after both `12-` files** |
| 23 | `22-fix-winery-delete-fk.sql` | winery delete FK fix |
| 24 | `23-winery-id-in-pricing.sql` | index `wineryId`, unique winery name |
| 25 | `24-stripe-events.sql` | webhook idempotency |
| 26 | `25-hardening-sweep.sql` | storage scoping, promo caps, `client_errors`. **Drops and recreates `validate_promo` — must come after `18-`** |
| 27 | `26-record-paid-order.sql` | transactional order write + `priced_orders` |

**Not part of a rebuild:** the data fixes and diagnostics below.

---

## One-off DATA fixes — do NOT re-run

These changed specific rows on the live database at a point in time. Re-running
them on a restored copy is pointless at best and harmful at worst.

| File | What it did |
|---|---|
| `07-remove-grove-from-threechimneys.sql` | unlinked Grove Mill from The Three Chimneys |
| `08-add-wairarapa26-code.sql` | created the `WAIRARAPA26` promo code |
| `09-remove-sally-test.sql` | removed a test account |
| `13-reassign-te-kairanga.sql` | reassigned Te Kairanga ownership |
| `19-seed-demo-wineries.sql` | seeded 240 directory wineries (go-live prep) |

## Read-only diagnostics — safe any time, never "applied"

| File | Purpose |
|---|---|
| `11-rls-audit.sql` | RLS posture audit |
| `20-diagnose-signups.sql` | signup queue diagnosis |

---

## Conventions for new migrations

1. **Next number, no duplicates.** Check `schema_migrations` for the highest.
2. **Idempotent** — `if not exists`, `create or replace`, `on conflict do nothing`.
3. **`create or replace` cannot change a function's return shape.** Add
   `drop function if exists name(argtypes);` first (this bit us on `validate_promo`).
4. **Separate schema from data.** A migration that edits specific rows is a data
   fix: label it `data` and keep it out of the rebuild sequence.
5. **Record it** — end the file with `select public.record_migration(…)`.
6. **Least privilege** — `revoke all … from public`, then grant only what the app
   needs. Service-role-only functions get no grant at all.

## Known follow-up

`23-winery-id-in-pricing.sql` adds a case-insensitive unique index on winery
name. If it raised a notice about duplicates, **merge the duplicate wineries in
the CRM and re-run that file** — until it succeeds, new duplicates can still be
created, which is what caused store settings to silently fall back to defaults.

_Last updated 20 August 2026._

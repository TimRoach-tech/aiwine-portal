# Store Settings — live wiring (portal → website)

> **Runnable migration: `13-store-settings.sql`** (in this folder) — run that in
> Supabase → SQL Editor. The SQL below is explanatory; the `.sql` file is canonical.

The Winery Portal now has a **Store settings** screen (`portal.js → RENDER.settings`).
In demo mode it persists to `localStorage` (`aiwine-portal:store-settings`).
Fulfilment uses the existing `set_fulfilment` RPC when live.

To make the NEW per-winery settings drive the live website/app, add columns to
the `wineries` table and one RPC, then have the website config sync read them.

## Suggested `wineries` columns
```sql
alter table wineries add column if not exists free_threshold int    default 6;
alter table wineries add column if not exists min_order      int    default 1;
alter table wineries add column if not exists mixed_cases     bool   default true;
alter table wineries add column if not exists paused          bool   default false;
alter table wineries add column if not exists paused_until    date;
alter table wineries add column if not exists dozen_on        bool   default false;
alter table wineries add column if not exists dozen_rate      numeric default 10;   -- percent
alter table wineries add column if not exists alloc_on        bool   default false;
alter table wineries add column if not exists alloc_cap       int    default 6;
alter table wineries add column if not exists alloc_wines     jsonb  default '[]';
alter table wineries add column if not exists local_pickup    bool   default true;
alter table wineries add column if not exists gift_message    bool   default false;
alter table wineries add column if not exists gift_wrap       bool   default false;
```

## RPC (called from store.js: `PStore.setStoreSettings(obj)`)
```sql
create or replace function set_store_settings(p_winery text, p_settings jsonb)
returns void language plpgsql security definer as $$
begin
  update wineries set
    free_threshold = coalesce((p_settings->>'freeThreshold')::int, free_threshold),
    min_order      = coalesce((p_settings->>'minOrder')::int, min_order),
    mixed_cases    = coalesce((p_settings->>'mixed')::bool, mixed_cases),
    paused         = coalesce((p_settings->>'paused')::bool, paused),
    paused_until   = nullif(p_settings->>'pausedUntil','')::date,
    dozen_on       = coalesce((p_settings->>'dozenOn')::bool, dozen_on),
    dozen_rate     = coalesce((p_settings->>'dozenRate')::numeric, dozen_rate),
    alloc_on       = coalesce((p_settings->>'allocOn')::bool, alloc_on),
    alloc_cap      = coalesce((p_settings->>'allocCap')::int, alloc_cap),
    alloc_wines    = coalesce(p_settings->'allocWines', alloc_wines),
    local_pickup   = coalesce((p_settings->>'pickup')::bool, local_pickup),
    gift_message   = coalesce((p_settings->>'giftMsg')::bool, gift_message),
    gift_wrap      = coalesce((p_settings->>'giftWrap')::bool, gift_wrap)
  where id = p_winery and owner = auth.uid();
end $$;
```

## Website read
The website cart already consumes `AIWINE_CONFIG.STORE_SETTINGS` (in
`site-*/assets/config.js`), keyed by winery/group name:
```js
STORE_SETTINGS: {
  "The Three Chimneys": { freeThreshold: 6, minOrder: 1, mixed: true,
                           paused: false, dozenOn: true, dozenRate: 10 }
}
```
`app.js → settingsOf()` reads it (with safe defaults); `caseDiscountOf()` prefers
`dozenOn/dozenRate` here over the legacy `CASE_DISCOUNT` map. Until the sync job
writes these from Supabase, edit `config.js` by hand — remember to bump
`AIWINE_V` in `boot.js` on any `assets/` change.

## Cart behaviour already wired from these settings
- **freeThreshold** — per-winery free-delivery point (6 or 12).
- **dozenOn/dozenRate** — Discovery Dozen discount (5/10/12.5/15/20%), off by default.
- **minOrder** — shows "X-bottle minimum — add N more".
- **mixed:false** — shows "One wine per case" note on that winery's shipment.
- (paused / allocation / pickup / gift — surfaced in the portal; wire into
  checkout when the columns above exist.)

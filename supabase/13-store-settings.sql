-- ============================================================
-- 13 · Store Settings — per-winery cart configuration
-- Adds the columns the Winery Portal "Store settings" screen writes,
-- and the RPC it calls. Safe to run multiple times (idempotent).
-- ============================================================

alter table wineries add column if not exists free_threshold int     default 6;
alter table wineries add column if not exists min_order      int     default 1;
alter table wineries add column if not exists mixed_cases    boolean default true;
alter table wineries add column if not exists paused         boolean default false;
alter table wineries add column if not exists paused_until   date;
alter table wineries add column if not exists dozen_on       boolean default false;
alter table wineries add column if not exists dozen_rate     numeric default 10;    -- percent (5/10/12.5/15/20)
alter table wineries add column if not exists alloc_on       boolean default false;
alter table wineries add column if not exists alloc_cap      int     default 6;
alter table wineries add column if not exists alloc_wines    jsonb   default '[]'::jsonb;
alter table wineries add column if not exists local_pickup   boolean default true;
alter table wineries add column if not exists gift_message   boolean default false;
alter table wineries add column if not exists gift_wrap      boolean default false;

-- Order-level capture of the customer's gift + delivery-method choices, so the
-- winery sees them on the portal Orders screen.
alter table orders   add column if not exists gifts          jsonb;
alter table orders   add column if not exists method         text default 'deliver';

-- Owner-scoped write of the whole settings blob (winery portal → set_store_settings).
create or replace function set_store_settings(p_winery text, p_settings jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update wineries set
    free_threshold = coalesce((p_settings->>'freeThreshold')::int,     free_threshold),
    min_order      = coalesce((p_settings->>'minOrder')::int,          min_order),
    mixed_cases    = coalesce((p_settings->>'mixed')::boolean,         mixed_cases),
    paused         = coalesce((p_settings->>'paused')::boolean,        paused),
    paused_until   = nullif(p_settings->>'pausedUntil','')::date,
    dozen_on       = coalesce((p_settings->>'dozenOn')::boolean,       dozen_on),
    dozen_rate     = coalesce((p_settings->>'dozenRate')::numeric,     dozen_rate),
    alloc_on       = coalesce((p_settings->>'allocOn')::boolean,       alloc_on),
    alloc_cap      = coalesce((p_settings->>'allocCap')::int,          alloc_cap),
    alloc_wines    = coalesce(p_settings->'allocWines',                alloc_wines),
    local_pickup   = coalesce((p_settings->>'pickup')::boolean,        local_pickup),
    gift_message   = coalesce((p_settings->>'giftMsg')::boolean,       gift_message),
    gift_wrap      = coalesce((p_settings->>'giftWrap')::boolean,      gift_wrap)
  where id = p_winery
    and exists (
      select 1 from winery_users wu
      where wu."wineryId" = wineries.id and wu."userId" = auth.uid()
    );

  if not found then
    raise exception 'not_authorised_for_winery';
  end if;
end $$;

grant execute on function set_store_settings(text, jsonb) to authenticated;

-- Let each winery read its own settings columns (RLS: extend existing wineries
-- select policy if needed — these columns are covered by the row policy already).

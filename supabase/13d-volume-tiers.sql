-- ============================================================
-- 13d · Volume tiers column + RPC update
-- Adds wineries.tiers (jsonb array of {pct, btls}) and updates
-- set_store_settings to persist it. Idempotent. Run in Supabase.
-- ============================================================

alter table public.wineries add column if not exists tiers jsonb default '[]'::jsonb;

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
    tiers          = coalesce(p_settings->'tiers',                     tiers),
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
notify pgrst, 'reload schema';

select id, name, tiers, dozen_on, dozen_rate from public.wineries where name ilike '%three chimneys%';

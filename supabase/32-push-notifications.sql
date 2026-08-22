-- ============================================================================
-- 32 · Push notifications for the winery app
-- ----------------------------------------------------------------------------
-- One row per DEVICE per user: a winery owner with a phone and a tablet gets two
-- subscriptions, and both should be notified. Endpoints are unique, so a
-- re-subscribe from the same device updates rather than duplicates.
--
-- Preferences live on winery_users, not on the user, because the same person may
-- want order alerts for one winery and not another.
--
-- Idempotent. Run before deploying the push code.
-- ============================================================================

create table if not exists public.push_subscriptions (
  id          bigserial primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  winery_id   text,
  endpoint    text not null unique,      -- the push service URL; unique per device
  p256dh      text not null,             -- client public key
  auth        text not null,             -- client auth secret
  user_agent  text,
  created_at  timestamptz default now(),
  last_seen   timestamptz default now(),
  last_error  text,                      -- set when a send fails (410 = expired)
  failures    integer default 0
);

create index if not exists push_subs_user_idx   on public.push_subscriptions (user_id);
create index if not exists push_subs_winery_idx on public.push_subscriptions (winery_id);

alter table public.push_subscriptions enable row level security;

-- A user manages only their own devices. Sends are done by the service role.
drop policy if exists "own push subscriptions" on public.push_subscriptions;
create policy "own push subscriptions" on public.push_subscriptions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Per-winery notification preferences
-- ---------------------------------------------------------------------------
alter table public.winery_users add column if not exists notify_new_order  boolean default true;
alter table public.winery_users add column if not exists notify_low_stock   boolean default true;
alter table public.winery_users add column if not exists notify_milestones  boolean default false;
alter table public.winery_users add column if not exists notify_account     boolean default true;

-- ---------------------------------------------------------------------------
-- Who should be notified about this winery? Used by the SEND endpoint under the
-- service role, so it takes the winery explicitly and does no auth.uid() check.
-- ---------------------------------------------------------------------------
create or replace function public.push_targets(p_winery text, p_kind text default 'new_order')
returns table (endpoint text, p256dh text, auth text, user_id uuid)
language plpgsql security definer set search_path = public as $$
begin
  return query
    select ps.endpoint, ps.p256dh, ps.auth, ps.user_id
      from push_subscriptions ps
      join winery_users wu
        on wu."userId" = ps.user_id
       and wu."wineryId" = p_winery
     where coalesce(ps.failures, 0) < 5      -- stop hammering dead endpoints
       and case p_kind
             when 'new_order'  then coalesce(wu.notify_new_order, true)
             when 'low_stock'  then coalesce(wu.notify_low_stock, true)
             when 'milestone'  then coalesce(wu.notify_milestones, false)
             when 'account'    then coalesce(wu.notify_account, true)
             else true
           end;
end $$;

revoke all on function public.push_targets(text,text) from public;
-- service-role only: no grant to anon or authenticated.

-- Record a failed send so a dead device is retired rather than retried forever.
create or replace function public.push_mark_failure(p_endpoint text, p_error text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update push_subscriptions
     set failures = coalesce(failures, 0) + 1, last_error = left(coalesce(p_error,''), 200)
   where endpoint = p_endpoint;
  -- 410 Gone / 404 means the browser threw the subscription away: delete it.
  delete from push_subscriptions
   where endpoint = p_endpoint and (p_error like '%410%' or p_error like '%404%');
end $$;

revoke all on function public.push_mark_failure(text,text) from public;

-- ============================================================================
-- VERIFY
--   select count(*) from push_subscriptions;
--   select * from push_targets('<winery-id>', 'new_order');
-- ============================================================================
select public.record_migration('32-push-notifications', 'schema',
  'push_subscriptions + per-winery notify prefs + push_targets/push_mark_failure');

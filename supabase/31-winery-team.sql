-- ============================================================================
-- 31 · Team & access: let a winery add its own users
-- ----------------------------------------------------------------------------
-- Today a winery login is linked to a winery by a winery_users row, but ONLY
-- staff can create that link (via approve_winery_request). So a winery that
-- hires someone has to email AIWine. This lets an OWNER add a colleague itself.
--
-- Security shape:
--   • Reading the team is done under RLS by the winery's own users.
--   • ADDING someone is NOT done client-side. Granting access to a winery's
--     orders and payouts is a privilege escalation, so it goes through a
--     service-role endpoint (portal/api/invite-user.js) which verifies the
--     caller is an OWNER of that winery before linking anyone.
--   • The last owner cannot be removed, and nobody can remove themselves —
--     otherwise a winery can lock itself out of its own account.
--
-- Idempotent. Run before deploying the Team & access screen.
-- ============================================================================

-- Roles: 'owner' can manage the team; 'staff' can work but not invite.
alter table public.winery_users
  add column if not exists role text default 'owner';
alter table public.winery_users
  add column if not exists invited_by text;
alter table public.winery_users
  add column if not exists created_at timestamptz default now();

-- Any existing link with no role becomes an owner (they were the account holder).
update public.winery_users set role = 'owner' where role is null;

create index if not exists winery_users_winery_idx on public.winery_users ("wineryId");

-- ---------------------------------------------------------------------------
-- Who is on my team? Returns the users linked to a winery the CALLER belongs to.
-- Reads auth.users, so it must be security definer — but it is scoped by an
-- explicit membership check, not by trusting the argument.
-- ---------------------------------------------------------------------------
create or replace function public.winery_team(p_winery text)
returns table (user_id uuid, email text, role text, created_at timestamptz, is_me boolean)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from winery_users
     where "userId" = auth.uid() and "wineryId" = p_winery
  ) then
    raise exception 'not_a_member';
  end if;

  return query
    select wu."userId", au.email::text, coalesce(wu.role, 'owner'),
           wu.created_at, wu."userId" = auth.uid()
      from winery_users wu
      join auth.users au on au.id = wu."userId"
     where wu."wineryId" = p_winery
     order by (coalesce(wu.role,'owner') = 'owner') desc, au.email;
end $$;

revoke all on function public.winery_team(text) from public;
grant execute on function public.winery_team(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Remove a colleague. Guards against a winery locking itself out.
-- ---------------------------------------------------------------------------
create or replace function public.remove_winery_user(p_winery text, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare owners integer;
begin
  if not exists (
    select 1 from winery_users
     where "userId" = auth.uid() and "wineryId" = p_winery
       and coalesce(role,'owner') = 'owner'
  ) then
    raise exception 'not_an_owner';
  end if;

  if p_user = auth.uid() then
    raise exception 'cannot_remove_yourself';
  end if;

  select count(*) into owners from winery_users
   where "wineryId" = p_winery and coalesce(role,'owner') = 'owner';
  if owners <= 1 and exists (
    select 1 from winery_users
     where "wineryId" = p_winery and "userId" = p_user
       and coalesce(role,'owner') = 'owner'
  ) then
    raise exception 'cannot_remove_last_owner';
  end if;

  delete from winery_users where "wineryId" = p_winery and "userId" = p_user;
end $$;

revoke all on function public.remove_winery_user(text,uuid) from public;
grant execute on function public.remove_winery_user(text,uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Change a colleague's role (owner <-> staff). Same owner-only guard.
-- ---------------------------------------------------------------------------
create or replace function public.set_winery_user_role(p_winery text, p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
declare owners integer;
begin
  if p_role not in ('owner','staff') then raise exception 'bad_role'; end if;
  if not exists (
    select 1 from winery_users
     where "userId" = auth.uid() and "wineryId" = p_winery
       and coalesce(role,'owner') = 'owner'
  ) then
    raise exception 'not_an_owner';
  end if;

  -- Don't allow demoting the only owner.
  if p_role = 'staff' then
    select count(*) into owners from winery_users
     where "wineryId" = p_winery and coalesce(role,'owner') = 'owner';
    if owners <= 1 then raise exception 'cannot_demote_last_owner'; end if;
  end if;

  update winery_users set role = p_role
   where "wineryId" = p_winery and "userId" = p_user;
end $$;

revoke all on function public.set_winery_user_role(text,uuid,text) from public;
grant execute on function public.set_winery_user_role(text,uuid,text) to authenticated;

-- ============================================================================
-- VERIFY
--   select * from winery_team('<your-winery-id>');
--   -- these must all fail:
--   select remove_winery_user('<winery>', auth.uid());        -- cannot_remove_yourself
-- ============================================================================
select public.record_migration('31-winery-team', 'schema',
  'winery_users role/invited_by/created_at + winery_team/remove/set_role RPCs');

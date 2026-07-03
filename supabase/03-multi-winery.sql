-- ============================================================
-- AIWine — MULTI-WINERY LOGINS (migration 03)
-- One login can now manage SEVERAL wineries (e.g. Foley Wines'
-- marketing team). Run AFTER 01 + 02. Safe to re-run.
--
-- What changes:
--   · winery_users: one row PER (user, winery) instead of one per user
--   · RLS: a user can act on any winery they are linked to
--   · approve_winery_request(): approving ADDS a link (never replaces)
--   · request_winery_access(): an already-linked user may request a
--     further winery (one pending request at a time)
--   · grant/revoke helpers for staff to link users directly
-- ============================================================

-- ---------- 1. winery_users → composite key ----------
do $$
begin
  -- drop the single-winery primary key / unique constraints if present
  if exists (select 1 from pg_constraint where conname = 'winery_users_pkey'
             and conrelid = 'winery_users'::regclass) then
    alter table winery_users drop constraint winery_users_pkey;
  end if;
  if exists (select 1 from pg_constraint where conname = 'winery_users_userid_uq') then
    alter table winery_users drop constraint winery_users_userid_uq;
  end if;
  -- composite primary key (idempotent)
  if not exists (select 1 from pg_constraint where conname = 'winery_users_user_winery_pk') then
    alter table winery_users add constraint winery_users_user_winery_pk
      primary key ("userId", "wineryId");
  end if;
end $$;
create index if not exists winery_users_user_idx on winery_users ("userId");

-- ---------- 2. multi-aware helper (my_winery() kept for compatibility) ----------
create or replace function my_winery()
returns text
language sql stable security definer set search_path = public as $$
  select "wineryId" from winery_users where "userId" = auth.uid()
  order by "createdAt" limit 1;
$$;

create or replace function is_my_winery(p_winery text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from winery_users
                 where "userId" = auth.uid() and "wineryId" = p_winery);
$$;

-- ---------- 3. RLS: scope to ANY linked winery ----------
drop policy if exists "winery owns its wines" on wines;
create policy "winery owns its wines" on wines for all to authenticated
  using (is_my_winery("wineryId"))
  with check (is_my_winery("wineryId"));

drop policy if exists "winery owns its orders" on orders;
create policy "winery owns its orders" on orders for all to authenticated
  using (is_my_winery("wineryId") or is_staff())
  with check (is_my_winery("wineryId") or is_staff());

drop policy if exists "items follow order" on order_items;
create policy "items follow order" on order_items for all to authenticated
  using (exists (select 1 from orders o where o.id = order_items."orderId"
                 and (is_my_winery(o."wineryId") or is_staff())))
  with check (exists (select 1 from orders o where o.id = order_items."orderId"
                 and (is_my_winery(o."wineryId") or is_staff())));

-- ---------- 4. requesting a FURTHER winery ----------
-- Same queue, same CRM screen. A linked user may submit a new request
-- (one pending at a time); approving ADDS a mapping.
create or replace function request_winery_access(
  p_name text, p_region text default null, p_website text default null,
  p_contact text default null, p_message text default null, p_country text default 'NZ'
) returns text language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'name_required'; end if;
  -- already linked to a winery of this name? nothing to do
  if exists (select 1 from winery_users wu join wineries w on w.id = wu."wineryId"
             where wu."userId" = auth.uid() and lower(w.name) = lower(trim(p_name))) then
    return 'linked';
  end if;
  insert into winery_signup_requests
    ("userId", email, "wineryName", region, website, contact, message, country, status)
  values
    (auth.uid(), (select email from auth.users where id = auth.uid()),
     trim(p_name), p_region, p_website, p_contact, p_message, coalesce(p_country,'NZ'), 'pending')
  on conflict ("userId") do update set
    "wineryName" = excluded."wineryName", region = excluded.region, website = excluded.website,
    contact = excluded.contact, message = excluded.message, country = excluded.country,
    status = 'pending', "createdAt" = now(), "reviewedAt" = null, "reviewedBy" = null;
  return 'pending';
end; $$;

-- ---------- 5. approval ADDS a link (never replaces existing ones) ----------
create or replace function approve_winery_request(p_user uuid, p_winery_id text default null)
returns text language plpgsql security definer set search_path = public as $$
declare req record; wid text;
begin
  if not is_staff() then raise exception 'not_staff'; end if;
  select * into req from winery_signup_requests where "userId" = p_user;
  if not found then raise exception 'no_request'; end if;

  wid := p_winery_id;
  if wid is null then
    select id into wid from wineries
      where lower(name) = lower(req."wineryName") and country = coalesce(req.country,'NZ')
      limit 1;
    if wid is null then
      insert into wineries (name, region, website, country, tier, status)
        values (req."wineryName", req.region, req.website, coalesce(req.country,'NZ'), 'listed', 'onboarding')
        returning id into wid;
    end if;
  end if;

  insert into winery_users ("userId","wineryId",role) values (p_user, wid, 'owner')
    on conflict ("userId","wineryId") do nothing;
  update winery_signup_requests
    set status='approved', "wineryId"=wid, "reviewedAt"=now(), "reviewedBy"=auth.uid()
    where "userId" = p_user;
  return wid;
end; $$;

-- ---------- 6. staff helpers: link / unlink directly (e.g. Foley setup) ----------
create or replace function grant_winery_access(p_user uuid, p_winery_id text, p_role text default 'manager')
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'not_staff'; end if;
  insert into winery_users ("userId","wineryId",role) values (p_user, p_winery_id, coalesce(p_role,'manager'))
    on conflict ("userId","wineryId") do update set role = excluded.role;
end; $$;
revoke all on function grant_winery_access(uuid,text,text) from public;
grant execute on function grant_winery_access(uuid,text,text) to authenticated;

create or replace function revoke_winery_access(p_user uuid, p_winery_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'not_staff'; end if;
  delete from winery_users where "userId" = p_user and "wineryId" = p_winery_id;
end; $$;
revoke all on function revoke_winery_access(uuid,text) from public;
grant execute on function revoke_winery_access(uuid,text) to authenticated;

-- ---------- 7. wineries readable by their linked users ----------
-- (needed so the portal can show names in the switcher; keep staff policy)
drop policy if exists "linked users read their wineries" on wineries;
create policy "linked users read their wineries" on wineries for select to authenticated
  using (is_my_winery(id) or is_staff());

-- ============================================================
-- VERIFY:
--   As staff, link one login to two wineries:
--     select grant_winery_access('<userId>','<wineryIdA>');
--     select grant_winery_access('<userId>','<wineryIdB>');
--   As that login: select "wineryId" from winery_users;  -- 2 rows
--     select count(*) from wines;  -- wines of BOTH wineries (and only those)
-- ============================================================

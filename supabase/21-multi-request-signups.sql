-- ============================================================
-- 21 · Allow MULTIPLE winery signup requests per user
-- ------------------------------------------------------------
-- Confirmed cause (Q2): winery_signup_requests has PRIMARY KEY ("userId") — one
-- row per user. An already-approved manager (Te Kairanga) submitting further
-- Foley wineries hits `on conflict ("userId")`, which OVERWRITES their single
-- row instead of queuing a new pending request — so the extra requests never
-- appear in the CRM queue.
--
-- Fix: key requests by ("userId","wineryName") so a user can have one row per
-- winery (their approved Te Kairanga row stays; each new winery is its own
-- pending row). Rewrites request/approve/reject to match. Idempotent.
-- Run in the Supabase SQL editor, then deploy the CRM (requests.jsx) bump.
-- ============================================================

-- 1. Re-key the table -------------------------------------------------------
alter table winery_signup_requests drop constraint if exists winery_signup_requests_pkey;
-- collapse any accidental dup (userId,wineryName) before adding the unique key
delete from winery_signup_requests a using winery_signup_requests b
  where a.ctid < b.ctid and a."userId" = b."userId"
    and lower(a."wineryName") = lower(b."wineryName");
alter table winery_signup_requests
  add constraint winery_signup_requests_user_winery_key unique ("userId","wineryName");

-- 2. request_winery_access — upsert on (userId, wineryName) ------------------
create or replace function request_winery_access(
  p_name text, p_region text default null, p_website text default null,
  p_contact text default null, p_message text default null, p_country text default 'NZ'
) returns text language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'name_required'; end if;
  if exists (select 1 from winery_users wu join wineries w on w.id = wu."wineryId"
             where wu."userId" = auth.uid() and lower(w.name) = lower(trim(p_name))) then
    return 'linked';
  end if;
  insert into winery_signup_requests
    ("userId", email, "wineryName", region, website, contact, message, country, status)
  values
    (auth.uid(), (select email from auth.users where id = auth.uid()),
     trim(p_name), p_region, p_website, p_contact, p_message, coalesce(p_country,'NZ'), 'pending')
  on conflict ("userId","wineryName") do update set
    region = excluded.region, website = excluded.website, contact = excluded.contact,
    message = excluded.message, country = excluded.country,
    status = 'pending', "createdAt" = now(), "reviewedAt" = null, "reviewedBy" = null;
  return 'pending';
end; $$;
revoke all on function request_winery_access(text,text,text,text,text,text) from public;
grant execute on function request_winery_access(text,text,text,text,text,text) to authenticated;

-- 3. approve — target the specific (user, winery-name) request ---------------
create or replace function approve_winery_request(
  p_user uuid, p_winery_id text default null, p_name text default null
) returns text language plpgsql security definer set search_path = public as $$
declare req record; wid text;
begin
  if not is_staff() then raise exception 'not_staff'; end if;
  select * into req from winery_signup_requests
    where "userId" = p_user and (p_name is null or lower("wineryName") = lower(p_name))
    order by ("status" = 'pending') desc, "createdAt" desc limit 1;
  if not found then raise exception 'no_request'; end if;

  wid := p_winery_id;
  if wid is null then
    select id into wid from wineries
      where lower(name) = lower(req."wineryName") and country = coalesce(req.country,'NZ') limit 1;
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
    where "userId" = p_user and "wineryName" = req."wineryName";
  return wid;
end; $$;
revoke all on function approve_winery_request(uuid,text,text) from public;
grant execute on function approve_winery_request(uuid,text,text) to authenticated;

-- 4. reject — target the specific (user, winery-name) request ----------------
create or replace function reject_winery_request(
  p_user uuid, p_reason text default null, p_name text default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'not_staff'; end if;
  update winery_signup_requests
    set status='rejected', message = coalesce(p_reason, message),
        "reviewedAt"=now(), "reviewedBy"=auth.uid()
    where "userId" = p_user
      and (p_name is null or lower("wineryName") = lower(p_name))
      and status = 'pending';
end; $$;
revoke all on function reject_winery_request(uuid,text,text) from public;
grant execute on function reject_winery_request(uuid,text,text) to authenticated;

-- VERIFY: Te Kairanga's manager re-submits a Foley winery in the portal → a new
-- 'pending' row appears in the CRM queue WITHOUT touching their approved
-- Te Kairanga row. Approving it adds a second winery to the same login.

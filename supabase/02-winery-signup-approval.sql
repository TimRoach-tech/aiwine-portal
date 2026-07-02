-- ============================================================
-- AIWine Winery Portal — open self-signup + staff approval (migration 02)
-- Runs against the SAME Supabase database as the CRM + portal schema 01.
--
-- Any winery can create their own login in the portal and submit a request to
-- join (their winery name, region, website, contact). The request lands in a
-- PENDING queue that staff review in the CRM (Winery signups). Approving a
-- request creates or links the winery record and grants portal access — after
-- which the winery can upload their range. No codes, no per-winery staff setup.
--
-- Security: a winery can only read/submit THEIR OWN request; they can never
-- write a winery_users mapping directly. The mapping is created only by
-- approve_winery_request(), which is SECURITY DEFINER and gated by is_staff().
-- Safe to re-run.
-- ============================================================

-- ---------- 1. the signup request queue ----------
create table if not exists winery_signup_requests (
  "userId"     uuid primary key references auth.users(id) on delete cascade,
  email        text,
  "wineryName" text not null,
  region       text,
  country      text default 'NZ',
  website      text,
  contact      text,
  message      text,
  status       text not null default 'pending',   -- pending | approved | rejected
  "wineryId"   text references wineries(id),       -- set on approval
  "createdAt"  timestamptz default now(),
  "reviewedAt" timestamptz,
  "reviewedBy" uuid
);
create index if not exists signup_requests_status_idx on winery_signup_requests (status);

alter table winery_signup_requests enable row level security;
-- a winery reads only its own request (to see status); staff read all
drop policy if exists "own or staff read requests" on winery_signup_requests;
create policy "own or staff read requests" on winery_signup_requests for select to authenticated
  using ("userId" = auth.uid() or is_staff());
-- only staff write directly (the review action). Winery submissions go through
-- request_winery_access() below, which runs as definer.
drop policy if exists "staff manage requests" on winery_signup_requests;
create policy "staff manage requests" on winery_signup_requests for all to authenticated
  using (is_staff()) with check (is_staff());

-- ---------- 2. winery submits / updates their own request ----------
create or replace function request_winery_access(
  p_name text, p_region text default null, p_website text default null,
  p_contact text default null, p_message text default null, p_country text default 'NZ'
) returns text language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'name_required'; end if;
  -- already approved & linked? nothing to do
  if exists (select 1 from winery_users where "userId" = auth.uid()) then
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
revoke all on function request_winery_access(text,text,text,text,text,text) from public;
grant execute on function request_winery_access(text,text,text,text,text,text) to authenticated;

-- ---------- 3. staff approve (creates or links the winery, grants access) ----------
-- Pass p_winery_id to link to an existing CRM winery; omit it to auto-create one
-- from the request (or reuse an existing winery of the same name in that market).
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
    on conflict ("userId") do update set "wineryId" = excluded."wineryId";
  update winery_signup_requests
    set status='approved', "wineryId"=wid, "reviewedAt"=now(), "reviewedBy"=auth.uid()
    where "userId" = p_user;
  return wid;
end; $$;
revoke all on function approve_winery_request(uuid,text) from public;
grant execute on function approve_winery_request(uuid,text) to authenticated;

-- ---------- 4. staff reject (winery may re-apply) ----------
create or replace function reject_winery_request(p_user uuid, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_staff() then raise exception 'not_staff'; end if;
  update winery_signup_requests
    set status='rejected', message = coalesce(p_reason, message), "reviewedAt"=now(), "reviewedBy"=auth.uid()
    where "userId" = p_user;
end; $$;
revoke all on function reject_winery_request(uuid,text) from public;
grant execute on function reject_winery_request(uuid,text) to authenticated;

-- ============================================================
-- Staff can also work the queue directly in SQL if ever needed:
--   select "userId", email, "wineryName", region, website, contact, "createdAt"
--   from winery_signup_requests where status='pending' order by "createdAt";
--   select approve_winery_request('<userId>');            -- auto-create/link winery
--   select approve_winery_request('<userId>', 'w1234abcd'); -- link to existing winery id
--   select reject_winery_request('<userId>', 'Could not verify');
-- Day to day, use the CRM → Winery signups screen instead.
-- ============================================================

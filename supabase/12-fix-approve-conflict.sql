-- ============================================================
-- AIWine — FIX: approve_winery_request ON CONFLICT mismatch (migration 12)
-- ------------------------------------------------------------
-- Symptom (portal "Approve" fails):
--   "there is no unique or exclusion constraint matching the ON CONFLICT
--    specification"
--
-- Cause:
--   Migration 02 defined approve_winery_request() with
--       insert into winery_users (...) on conflict ("userId") ...
--   Migration 03 (multi-winery) then REPLACED winery_users' single-column
--   userId key with a COMPOSITE key ("userId","wineryId") — so a login can
--   hold several wineries. On a database where 03 ran but the OLD 02 function
--   is still installed (03 not applied, or 02 re-run after 03), the upsert
--   targets a userId-only unique constraint that no longer exists → the error.
--
-- Fix:
--   Re-install the function with the composite conflict target. Idempotent and
--   safe to re-run. (Equivalent to the version shipped in 03-multi-winery.sql —
--   run this if you don't want to re-run all of 03.)
-- ============================================================

create or replace function approve_winery_request(p_user uuid, p_winery_id text default null)
returns text language plpgsql security definer set search_path = public as $$
declare req record; wid text;
begin
  if not is_staff() then raise exception 'not_staff'; end if;
  select * into req from winery_signup_requests where "userId" = p_user;
  if not found then raise exception 'no_request'; end if;

  wid := p_winery_id;
  if wid is null then
    -- reuse an existing winery of the same name in the same market, else create one
    select id into wid from wineries
      where lower(name) = lower(req."wineryName") and country = coalesce(req.country,'NZ')
      limit 1;
    if wid is null then
      insert into wineries (name, region, website, country, tier, status)
        values (req."wineryName", req.region, req.website, coalesce(req.country,'NZ'), 'listed', 'onboarding')
        returning id into wid;
    end if;
  end if;

  -- ADD the (user → winery) link; composite key means the manager can hold many
  insert into winery_users ("userId","wineryId",role) values (p_user, wid, 'owner')
    on conflict ("userId","wineryId") do nothing;

  update winery_signup_requests
    set status='approved', "wineryId"=wid, "reviewedAt"=now(), "reviewedBy"=auth.uid()
    where "userId" = p_user;
  return wid;
end; $$;

revoke all on function approve_winery_request(uuid,text) from public;
grant execute on function approve_winery_request(uuid,text) to authenticated;

-- VERIFY:
--   Portal → Winery signups → Approve the pending Te Kairanga request. It should
--   now succeed and auto-create "Te Kairanga" as its own winery (The Runholder
--   restaurant record is left untouched).

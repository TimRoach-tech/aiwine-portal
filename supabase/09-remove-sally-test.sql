-- ============================================================
-- AIWine — remove the "Sally Test" test winery + signup (migration 09)
-- A test self-signup ("Sally Test", sally@roachs.info) was approved, which
-- auto-created a winery record. This removes the test winery, its owner link,
-- and the signup request so it doesn't clutter the live data. It does NOT
-- delete the auth user (sally@roachs.info can re-apply later if wanted).
--
-- Run in Supabase → SQL Editor. Do STEP 1, read it, then STEP 2.
-- ============================================================

-- ---------- STEP 1 — see the test records ----------
select r."userId", au.email, r."wineryName", r.status, r."wineryId", w.name as winery
from winery_signup_requests r
join auth.users au on au.id = r."userId"
left join wineries w on w.id = r."wineryId"
where lower(au.email) = 'sally@roachs.info' or lower(r."wineryName") like 'sally test%';

-- ---------- STEP 2 — remove the link, the auto-created winery, and the request ----------
-- (Order matters: drop the owner mapping and request first, then the winery.)
delete from winery_users
  where "wineryId" in (select id from wineries where lower(name) = 'sally test');

delete from winery_signup_requests
  where lower("wineryName") like 'sally test%'
     or "userId" in (select id from auth.users where lower(email) = 'sally@roachs.info');

delete from wineries where lower(name) = 'sally test';

-- ---------- STEP 3 — confirm (re-run STEP 1) → expect no rows ----------

-- OPTIONAL — also delete the test login entirely (so the email is free to reuse
-- for a fresh end-to-end test). Only if you don't want to keep the account:
--   delete from auth.users where lower(email) = 'sally@roachs.info';

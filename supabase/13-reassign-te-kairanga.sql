-- ============================================================
-- AIWine — HOTFIX: move Te Kairanga off the wrong login (migration 13)
-- ------------------------------------------------------------
-- Situation: approving the request linked "Te Kairanga" to the STAFF login
-- that clicked Approve, so it now shows alongside your own winery
-- (The Three Chimneys). This removes that wrong link and (optionally) links
-- Te Kairanga to the correct Foley manager instead. The winery record itself
-- is fine and stays — we only fix WHO it is linked to.
--
-- Run the blocks in order in Supabase → SQL Editor. Read the SELECTs first so
-- you paste the right ids/emails. Safe & reversible.
-- ============================================================

-- 1) Confirm the winery id + who is currently linked to it -------------------
select w.id as winery_id, w.name, wu."userId", u.email, wu.role
from wineries w
join winery_users wu on wu."wineryId" = w.id
join auth.users u on u.id = wu."userId"
where lower(w.name) = lower('Te Kairanga');

-- 2) REMOVE the wrong link (your own staff login) ----------------------------
--    Replace the email with YOUR login email (the one that clicked Approve).
delete from winery_users
where "wineryId" = (select id from wineries where lower(name)=lower('Te Kairanga') limit 1)
  and "userId"   = (select id from auth.users where lower(email)=lower('YOUR_STAFF_EMAIL@aiwine.co.nz') limit 1);

-- 3) LINK it to the correct Foley manager ------------------------------------
--    Replace with the Foley marketing manager's login email. This makes Te
--    Kairanga appear under THEIR portal, on its own, as owner.
insert into winery_users ("userId","wineryId",role)
values (
  (select id from auth.users where lower(email)=lower('FOLEY_MANAGER_EMAIL@example.com') limit 1),
  (select id from wineries  where lower(name)=lower('Te Kairanga') limit 1),
  'owner'
)
on conflict ("userId","wineryId") do nothing;

-- 4) VERIFY — Te Kairanga should now list ONLY the Foley manager -------------
select w.name, u.email, wu.role
from wineries w
join winery_users wu on wu."wineryId" = w.id
join auth.users u on u.id = wu."userId"
where lower(w.name) = lower('Te Kairanga');

-- (If the Foley manager hasn't created a login yet, skip step 3; step 2 alone
--  clears it from your list. Then approve their request normally once they've
--  signed up, which links it to them.)

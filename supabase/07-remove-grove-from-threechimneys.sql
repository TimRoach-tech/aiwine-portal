-- ============================================================
-- AIWine — GO-LIVE CLEANUP: unlink "Grove" from The Three Chimneys
-- ------------------------------------------------------------
-- During multi-winery testing a second winery ("Grove") was linked to
-- the Three Chimneys login. This removes ONLY that mapping — it does not
-- touch the Three Chimneys winery, its wines, or the login itself.
--
-- Run in Supabase → SQL Editor. Do STEP 1 first and read the result,
-- then run STEP 2. Safe / idempotent.
-- ============================================================

-- ---------- STEP 1 — see exactly what the Three Chimneys login manages ----------
-- (Expect 2 rows before the fix: "The Three Chimneys" + a Grove winery.
--  If you only see The Three Chimneys, the cleanup is already done.)
select wu."userId", au.email, w.id as winery_id, w.name as winery
from winery_users wu
join wineries w  on w.id = wu."wineryId"
join auth.users au on au.id = wu."userId"
where wu."userId" in (
  select wu2."userId" from winery_users wu2
  join wineries w2 on w2.id = wu2."wineryId"
  where lower(w2.name) like 'the three chimneys%'
     or lower(w2.name) like 'three chimneys%'
)
order by au.email, w.name;

-- ---------- STEP 2 — remove the Grove link from that login only ----------
-- Deletes the (Three-Chimneys-user → Grove-winery) row(s) and nothing else.
delete from winery_users wu
using wineries w
where wu."wineryId" = w.id
  and lower(w.name) like '%grove%'
  and wu."userId" in (
    select wu2."userId" from winery_users wu2
    join wineries w2 on w2.id = wu2."wineryId"
    where lower(w2.name) like 'the three chimneys%'
       or lower(w2.name) like 'three chimneys%'
  );

-- ---------- STEP 3 — confirm (re-run STEP 1) → expect ONLY The Three Chimneys ----------

-- OPTIONAL — if the Grove winery row was a test that no other login uses,
-- you can also delete the winery itself. Check first that nothing links to it:
--   select * from winery_users where "wineryId" =
--     (select id from wineries where lower(name) like '%grove%' limit 1);
-- If that returns no rows, then:
--   delete from wineries where lower(name) like '%grove%';
-- (Leave this commented unless you're sure the Grove winery is a test.)

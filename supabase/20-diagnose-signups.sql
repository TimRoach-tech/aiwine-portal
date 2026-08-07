-- ============================================================
-- 20 · DIAGNOSE — winery signups not appearing + count jump
-- Read-only. Run each query in the Supabase SQL editor and read the notes.
-- ============================================================

-- Q1 · Are you seen as staff? If this is NOT true for your CRM login, the
--      signup queue RLS ("userId = auth.uid() OR is_staff()") hides ALL rows
--      and you'd see zero notifications. Run while signed in as the CRM user.
select is_staff() as i_am_staff, auth.uid() as my_uid;

-- Q2 · Every signup request, newest first. If Te Kairanga's Foley attempts are
--      here as 'pending' but not in the CRM, it's an is_staff()/RLS problem (Q1).
--      If they're NOT here at all, it's the one-row-per-user overwrite (see note).
select r."userId", au.email, r."wineryName", r.status, r."createdAt", r."reviewedAt"
from winery_signup_requests r
join auth.users au on au.id = r."userId"
order by r."createdAt" desc;

-- Q3 · The count jump. This is the 240 demo wineries seeded by 19-seed-demo-
--      wineries.sql. Confirm how many came from the seed vs real signups.
select count(*) as total_wineries,
       count(*) filter (where status = 'onboarding') as onboarding_seeded_like,
       count(*) filter (where status = 'active')     as active;

-- Q4 · Foley duplicates now sitting in the directory (these are why a further
--      Foley signup may behave oddly). Adjust the name filter as needed.
select id, name, region, status, slug
from wineries
where lower(name) like any (array['%te kairanga%','%martinborough vineyard%',
      '%grove mill%','%foley%','%runholder%','%tk wine%'])
order by name;

-- ============================================================
-- WHY NOTIFICATIONS STOPPED (most likely, in order):
--
-- A. winery_signup_requests has PRIMARY KEY ("userId") — ONE request row per
--    user, ever. request_winery_access() upserts with `on conflict ("userId")
--    do update ... status='pending'`. So when an ALREADY-APPROVED winery user
--    (Te Kairanga) tries to add SEVERAL other Foley wineries, each attempt
--    OVERWRITES the previous one — only the last survives, and it also clobbers
--    their own approved request row. Adding multiple wineries cannot queue.
--    → Fix is 21-multi-request-signups.sql (composite key userId+wineryName).
--
-- B. If Q1 shows i_am_staff = false, the RLS tighten / a staff-mapping change
--    is hiding the whole queue from you. Fix: ensure your CRM login is in the
--    staff set that is_staff() checks (see 02/03 for its definition).
--
-- C. The 240-winery seed (issue 1) is expected and explains 600+ -> 801. It does
--    NOT by itself hide signups, but it means Foley winery NAMES may already
--    exist in the directory — relevant when you approve the requests.
-- ============================================================

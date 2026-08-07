-- ============================================================
-- 22 · Fix "can't delete a winery" (foreign-key block)
-- ------------------------------------------------------------
-- Symptom: deleting a winery in the CRM appears to do nothing — the row
-- reappears. Cause: winery_signup_requests."wineryId" references wineries(id)
-- with NO on-delete rule (see 02-winery-signup-approval.sql line 28). Once a
-- signup request is APPROVED it stores that wineryId, so Postgres refuses to
-- delete the winery ("violates foreign key constraint
-- winery_signup_requests_wineryId_fkey"). The CRM catches the error and
-- re-syncs, so the delete silently fails.
--
-- Fix: recreate that FK with ON DELETE SET NULL — deleting a winery keeps the
-- signup-request history but unlinks it (wineryId → null). Every OTHER FK to
-- wineries (winery_users, orders, wines) already cascades, so this is the only
-- blocker. Idempotent; safe to re-run. Run in the Supabase SQL editor.
-- ============================================================

-- 1. Recreate the FK with ON DELETE SET NULL --------------------------------
alter table winery_signup_requests
  drop constraint if exists "winery_signup_requests_wineryId_fkey";
alter table winery_signup_requests
  add  constraint "winery_signup_requests_wineryId_fkey"
  foreign key ("wineryId") references wineries(id) on delete set null;

-- 2. (Optional) clean up the three portal test wineries ---------------------
-- Review first, then uncomment the delete. Cascades remove their wines,
-- orders and winery_users; the FK above unlinks any signup request.
--
-- select id, name, region, status from wineries
--   where name ilike 'test%' order by name;
--
-- delete from wineries where name in ('test', 'test 2', 'test 3');

-- VERIFY: after running section 1, deleting a winery in the CRM (Wineries →
-- select → Delete) succeeds and the row stays gone after refresh.

-- ============================================================
-- AIWine — let the public website read the winery DIRECTORY (migration 10)
-- Root cause found 14 Jul: the website's live winery directory (region pages,
-- Martinborough/Wairarapa pages, homepage region counts) fetches
--   /rest/v1/wineries?select=name,region,fulfilment
-- with the ANON key, but `wineries` had NO anon SELECT privilege → every call
-- returned 42501 "permission denied", so the live directory silently never
-- populated and region counts never updated.
--
-- This grants the public read access to ONLY the directory columns of
-- `wineries` (id, name, region, fulfilment) — never contact emails, orders,
-- Stripe or plan fields. Wines already have their own "public reads published
-- wines" policy; this is the winery-side equivalent.
--
-- Safe to re-run. Run in Supabase → SQL Editor.
-- ============================================================

alter table wineries enable row level security;

-- 1. PUBLIC (anon) may READ wineries — the website directory. RLS gates ROWS;
--    the column GRANT below gates COLUMNS so only safe fields are exposed.
drop policy if exists "public reads winery directory" on wineries;
create policy "public reads winery directory" on wineries for select to anon
  using (true);

-- Column-level grant: anon can select ONLY these columns (not contact email,
-- orders email, plan flags, etc). Revoke any broad grant first to be safe.
revoke select on wineries from anon;
grant select ("id", "name", "region", "fulfilment") on wineries to anon;

-- NOTE: existing staff/owner policies (is_staff(), my_winery()) are unchanged;
-- they run as `authenticated` and are unaffected by the anon grant above.

-- VERIFY (as anon, e.g. from the site or curl with the publishable key):
--   select name, region, fulfilment from wineries order by name;   -- should return rows
--   select "ordersEmail" from wineries limit 1;                    -- should ERROR (column not granted)

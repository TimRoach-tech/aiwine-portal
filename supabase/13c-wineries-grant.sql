-- ============================================================
-- 13c · Grant anon/authenticated SELECT on wineries + reload cache
-- Fixes: REST error 401 "permission denied for table wineries"
--   (code 42501) when the website reads winery store-settings.
-- The public shop reads winery name/region/fulfilment/settings with
-- the ANON key; row visibility is still governed by RLS policies.
-- Idempotent. Run in the Supabase SQL editor.
-- ============================================================

-- Table-level SELECT privilege (this is what the 401 is about).
grant select on table public.wineries to anon, authenticated;

-- Make sure RLS is enabled and there is a public-read policy so rows are
-- actually returned (grant alone isn't enough when RLS is on). This policy
-- exposes winery rows for the marketplace; adjust the USING clause if you want
-- to restrict to a "published"/"approved" flag (e.g. using (approved = true)).
alter table public.wineries enable row level security;

drop policy if exists "wineries public read" on public.wineries;
create policy "wineries public read" on public.wineries
  for select to anon, authenticated
  using (true);

-- Refresh PostgREST so the grant/policy take effect immediately.
notify pgrst, 'reload schema';

-- Verify the anon-visible read works and shows the settings:
select id, name, dozen_on, dozen_rate, free_threshold, min_order,
       mixed_cases, paused, local_pickup
from public.wineries
where name ilike '%three chimneys%';

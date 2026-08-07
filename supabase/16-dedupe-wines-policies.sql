-- ============================================================================
-- AIWine — 13-dedupe-wines-policies.sql  (optional cleanup after 12-rls-tighten)
-- The `wines` table accumulated FOUR authenticated ALL policies that overlap:
--   "winery owns its wines"    ALL  wineryId IN (SELECT my_wineries())   ← KEEP
--   "winery manages own wines" ALL  wineryId = my_winery()              ← drop (subset of the above; singular helper misses multi-winery logins)
--   "staff manage all wines"   ALL  is_staff()                          ← KEEP
--   "staff only"               ALL  is_staff()                          ← drop (exact duplicate)
-- Postgres ORs them so this changes NO access — it just removes dead weight and
-- the multi-winery footgun of the singular my_winery() policy.
-- Idempotent. Run in Supabase → SQL Editor. Safe to skip; purely tidiness.
-- ============================================================================

drop policy if exists "winery manages own wines" on public.wines;
drop policy if exists "staff only"                on public.wines;

-- Keeps on wines:
--   "winery owns its wines"        (authenticated ALL, wineryId IN my_wineries())
--   "staff manage all wines"       (authenticated ALL, is_staff())
--   "public reads published wines" (anon SELECT, published = true)

-- ============================================================================
-- VERIFY: re-run the wines policy list — expect exactly THREE policies:
--   select policyname, cmd, roles, qual from pg_policies
--   where schemaname='public' and tablename='wines' order by policyname;
-- Isolation is unchanged: a winery still reaches only wineryId IN my_wineries().
-- ============================================================================

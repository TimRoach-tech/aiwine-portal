-- ============================================================================
-- AIWine — 12-rls-tighten.sql  (follow-up to 11-rls-audit.sql)
-- Based on the ACTUAL audit output (query 5, 3 Aug 2026):
--   scan_intel · scan_intel_insert            · INSERT · NULL   ← no WITH CHECK
--   wineries   · public reads safe winery columns · SELECT · true  ┐ THREE
--   wineries   · public reads winery directory    · SELECT · true  ├ duplicate
--   wineries   · wineries public read             · SELECT · true  ┘ anon reads
--   wines      · public reads published wines · SELECT · (published = true)  ✓ ok
--
-- Run in Supabase → SQL Editor. Idempotent; safe to re-run. Changes only the
-- two findings — it does NOT touch wines (already correct) or any other table.
-- ============================================================================

-- 1) wineries: collapse the THREE identical anon SELECT policies into ONE.
--    Postgres ORs them, so three copies == one, but it's a confusing
--    maintenance trap. Drop two, keep a single clearly-named policy.
--    (Row visibility is unchanged — still all rows to anon; the COLUMN grant is
--    what limits which winery fields anon can actually read.)
drop policy if exists "public reads safe winery columns" on public.wineries;
drop policy if exists "wineries public read"             on public.wineries;
-- keeps: "public reads winery directory"  (SELECT to anon USING (true))

-- If you'd rather standardise the NAME too, run these two lines instead of
-- keeping the directory one (optional — comment out the block above if so):
--   drop policy if exists "public reads winery directory" on public.wineries;
--   create policy "wineries_public_read" on public.wineries
--     for select to anon using (true);

-- 2) scan_intel: this is a LEGITIMATE public feature — the consumer bottle-scan
--    (apps/consumer/bottle-scan.js) fires an anonymous, fire-and-forget row as a
--    winery-recruitment signal. Keep the anon INSERT, but add a WITH CHECK so a
--    holder of the publishable key can't stuff arbitrary/oversized payloads.
--    The client only ever sends these columns, already length-capped; we enforce
--    the same bounds server-side and pin country.
drop policy if exists "scan_intel_insert" on public.scan_intel;
create policy "scan_intel_insert" on public.scan_intel
  for insert to anon
  with check (
        char_length(coalesce(producer,  '')) <= 120
    and char_length(coalesce(wine_name, '')) <= 160
    and char_length(coalesce(variety,   '')) <= 80
    and char_length(coalesce(region,    '')) <= 80
    and char_length(coalesce(vintage,   '')) <= 8
    and char_length(coalesce(country,   '')) <= 4
  );

-- Note: anon has INSERT only on scan_intel — no SELECT — so the recruitment
-- signal is write-only from the browser and readable only via the service_role
-- key (CRM/portal). If query 5 ever shows an anon SELECT on scan_intel, drop it.

-- ============================================================================
-- VERIFY: re-run 11-rls-audit.sql query 5. It should now list EXACTLY:
--   scan_intel · scan_intel_insert          · INSERT · (char_length checks…)
--   wineries   · public reads winery directory · SELECT · true
--   wines      · public reads published wines  · SELECT · (published = true)
-- Three rows, one per table. Anything else granting anon is a new finding.
-- ============================================================================

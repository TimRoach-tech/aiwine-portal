-- ============================================================
-- 14 · Public read of wineries (fixes the 401 on the website)
-- The public site fetches:
--   /rest/v1/wineries?select=name,region,fulfilment&order=name
-- to hydrate per-winery fulfilment profiles for the cart. With RLS on and
-- no anon SELECT policy, the anon key gets 401. This mirrors the public
-- read the `wines` table already allows. Safe / idempotent.
--
-- These columns are non-sensitive storefront settings (name, region, and the
-- cart rules the shopper needs to see anyway). No customer or owner data is
-- exposed. Run once in Supabase → SQL editor.
-- ============================================================

alter table wineries enable row level security;

drop policy if exists "wineries public read" on wineries;

create policy "wineries public read"
  on wineries
  for select
  to anon, authenticated
  using (true);

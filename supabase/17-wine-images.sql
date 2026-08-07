-- ============================================================================
-- AIWine — 17-wine-images.sql
-- Wire winery bottle photos to Supabase Storage so they appear on the website
-- (today they live only in the winery's browser localStorage).
-- Run in the Supabase SQL editor. Idempotent.
-- ============================================================================

-- 1) Column on wines to hold the public image URL --------------------------
alter table public.wines add column if not exists image_url text;

-- 2) Public Storage bucket for bottle photos --------------------------------
--    Public read (photos are shown on the open marketplace); writes are
--    controlled by the policies below (authenticated winery users only).
insert into storage.buckets (id, name, public)
values ('wine-images', 'wine-images', true)
on conflict (id) do update set public = true;

-- 3) Storage policies -------------------------------------------------------
--    Anyone can READ (public marketplace). Only authenticated users can write,
--    and only inside the wine-images bucket. (Per-winery path scoping is done
--    in the app by naming files <wineryId>/<wineId>.jpg; tighten here later if
--    you want DB-enforced per-winery isolation on writes.)
drop policy if exists "wine-images public read"  on storage.objects;
create policy "wine-images public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'wine-images');

drop policy if exists "wine-images auth write"   on storage.objects;
create policy "wine-images auth write" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'wine-images');

drop policy if exists "wine-images auth update"  on storage.objects;
create policy "wine-images auth update" on storage.objects
  for update to authenticated
  using (bucket_id = 'wine-images') with check (bucket_id = 'wine-images');

drop policy if exists "wine-images auth delete"  on storage.objects;
create policy "wine-images auth delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'wine-images');

-- ============================================================================
-- After this: the portal uploads each photo to the wine-images bucket and saves
-- its public URL into wines.image_url; the consumer site/app read image_url
-- (mapRow → w.image) and show it on cards + quicklook. No cache bump needed on
-- the site for the DB change, but the wine-source.js update ships with one.
-- ============================================================================

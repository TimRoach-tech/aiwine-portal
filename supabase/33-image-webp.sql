-- ============================================================================
-- 33 · Responsive bottle images (WebP variants)
-- ----------------------------------------------------------------------------
-- Bottle photos are a single 640x854 PNG today, served at every size from a
-- 26px portal thumbnail to a full quicklook. On a phone browse grid that is ~24
-- full-size desktop PNGs over mobile data to render at ~150px wide.
--
-- Rather than replace image_url (which would break every existing wine and lose
-- the transparent PNG the cards rely on), we ADD a WebP base URL. The site uses
-- WebP with srcset when present and falls back to the PNG when not, so old wines
-- keep working untouched and new uploads get the smaller files.
--
-- Variants live alongside at a fixed naming convention, all written in the same
-- upload, so a URL is never guessed for a file that does not exist:
--     <wineryId>/<wineId>.png        original, transparent  (image_url)
--     <wineryId>/<wineId>-640.webp   image_webp points here
--     <wineryId>/<wineId>-400.webp
--     <wineryId>/<wineId>-200.webp
--
-- Idempotent.
-- ============================================================================

alter table public.wines add column if not exists image_webp text;

-- ============================================================================
-- VERIFY
--   select id, name, image_url is not null as has_png, image_webp is not null as has_webp
--     from wines where image_url is not null limit 10;
-- ============================================================================
select public.record_migration('33-image-webp', 'schema',
  'wines.image_webp for responsive WebP bottle variants (PNG kept as fallback)');

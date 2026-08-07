-- ============================================================================
-- AIWine — 15-wine-why.sql
-- Adds the distinct "Why customers will like it" field to wines — the sommelier
-- pitch shown in the "✦ Why we think you'll like it" block on the website, kept
-- SEPARATE from the factual tasting note (which was previously duplicated there).
-- Idempotent. Run in the Supabase SQL editor (same project as CRM/portal).
-- ============================================================================

alter table public.wines add column if not exists why text;

-- The website only renders the block when `why` is present AND differs from
-- `notes`, so existing rows (why = null) simply stop showing the duplicate —
-- no backfill needed. Populate `why` per wine via the portal Add-bottle form,
-- a "Why you'll like it" column in the upload spreadsheet, or the AI sommelier.

--   select id, name, left(notes,40) as notes, left(why,40) as why
--   from public.wines order by updated_at desc limit 10;

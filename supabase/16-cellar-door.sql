-- ============================================================
-- 16 · Virtual Cellar Door content — store the editable profile
-- so it reaches the website (was portal-localStorage only).
-- The activation flag "cellarDoorActive" already exists (05).
-- Idempotent. Run in the Supabase SQL editor.
-- ============================================================

alter table public.wineries add column if not exists cellar_story text;
alter table public.wineries add column if not exists cellar_hours text;
alter table public.wineries add column if not exists cellar_image text;   -- public URL (wine-images bucket)

notify pgrst, 'reload schema';

-- The website reads these for any winery with "cellarDoorActive" = true:
--   select name, "cellarDoorActive", cellar_story, cellar_hours, cellar_image
--   from public.wineries where "cellarDoorActive" = true;

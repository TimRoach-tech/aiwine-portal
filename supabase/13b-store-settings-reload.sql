-- ============================================================
-- 13b · Store Settings — columns + SCHEMA CACHE RELOAD + verify
-- Run this in the Supabase SQL editor. Idempotent.
-- Use this if 13-store-settings.sql "ran" but the website still
-- reports the columns missing (storeSettingsKeys empty) — that is
-- the PostgREST REST API serving a STALE schema cache.
-- ============================================================

-- 1) Columns (same as 13; safe to re-run) --------------------
alter table public.wineries add column if not exists free_threshold int     default 6;
alter table public.wineries add column if not exists min_order      int     default 1;
alter table public.wineries add column if not exists mixed_cases    boolean default true;
alter table public.wineries add column if not exists paused         boolean default false;
alter table public.wineries add column if not exists paused_until   date;
alter table public.wineries add column if not exists dozen_on       boolean default false;
alter table public.wineries add column if not exists dozen_rate     numeric default 10;
alter table public.wineries add column if not exists alloc_on       boolean default false;
alter table public.wineries add column if not exists alloc_cap      int     default 6;
alter table public.wineries add column if not exists alloc_wines    jsonb   default '[]'::jsonb;
alter table public.wineries add column if not exists local_pickup   boolean default true;
alter table public.wineries add column if not exists gift_message   boolean default false;
alter table public.wineries add column if not exists gift_wrap      boolean default false;

-- 2) FORCE PostgREST to reload its schema cache so the REST API
--    (which the website uses) exposes the new columns immediately.
notify pgrst, 'reload schema';

-- 3) VERIFY — this SELECT must succeed and list all 13 columns.
--    If it errors, the columns really didn't get created (wrong DB?).
select column_name
from information_schema.columns
where table_schema = 'public' and table_name = 'wineries'
  and column_name in (
    'free_threshold','min_order','mixed_cases','paused','paused_until',
    'dozen_on','dozen_rate','alloc_on','alloc_cap','alloc_wines',
    'local_pickup','gift_message','gift_wrap')
order by column_name;

-- 4) Show the Three Chimneys row so you can confirm dozen_on/dozen_rate
--    are actually set (re-save in the portal if they're default).
select id, name, dozen_on, dozen_rate, free_threshold, min_order,
       mixed_cases, paused, local_pickup
from public.wineries
where name ilike '%three chimneys%';

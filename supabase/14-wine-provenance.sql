-- ============================================================================
-- AIWine — 14-wine-provenance.sql
-- Adds "who + when" audit columns to wines so the portal can show who uploaded
-- or last changed a wine, and when. Idempotent — safe to run more than once.
-- Run in the Supabase SQL editor (same project as the CRM/portal).
-- ============================================================================

-- 1. Columns -----------------------------------------------------------------
alter table public.wines add column if not exists created_by text;      -- email of the user who first added the wine
alter table public.wines add column if not exists created_at timestamptz default now();
alter table public.wines add column if not exists updated_by text;      -- email of the user who last changed it
alter table public.wines add column if not exists updated_at timestamptz default now();

-- 2. Backfill existing rows so old wines don't show blank --------------------
update public.wines set created_at = coalesce(created_at, now()) where created_at is null;
update public.wines set updated_at = coalesce(updated_at, created_at, now()) where updated_at is null;

-- 3. Auto-stamp updated_at on every UPDATE (belt-and-braces; the portal also
--    sets it explicitly, but this guarantees it even for direct DB edits). ----
create or replace function public.wines_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_wines_touch on public.wines;
create trigger trg_wines_touch
  before update on public.wines
  for each row execute function public.wines_touch_updated_at();

-- Note: created_by / updated_by are set by the portal (store.js) from the
-- authenticated user's email. RLS already scopes wines to their wineryId, so no
-- policy change is needed — these are ordinary columns on an already-protected row.

-- 4. Verify ------------------------------------------------------------------
--   select id, name, created_by, created_at, updated_by, updated_at
--   from public.wines order by updated_at desc limit 10;

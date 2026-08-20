-- ============================================================================
-- 00 · Migration tracking (run FIRST on any database, old or new)
-- ----------------------------------------------------------------------------
-- PROBLEM (audit High): there are 30+ migration files with DUPLICATE prefixes
-- (two 12-, four 13-, two 14-, two 16-) and nothing recording what has been
-- applied. Files are individually idempotent, but the ORDER between same-numbered
-- files is undefined and several later files redefine earlier functions. Result:
-- rebuilding this database from scratch — after an incident, or to clone staging
-- — is not reliably reproducible.
--
-- FIX: a tracking table plus a helper, so every migration records itself. This
-- file does NOT rename or re-run anything; existing files stay exactly as they
-- are (some are one-off DATA fixes that must never run twice — see MIGRATIONS.md).
--
-- Safe to run on the live database. Idempotent.
-- ============================================================================

create table if not exists public.schema_migrations (
  version     text primary key,      -- file basename, e.g. '24-stripe-events'
  kind        text,                   -- schema | data | diagnostic
  applied_at  timestamptz default now(),
  applied_by  text default current_user,
  note        text
);

alter table public.schema_migrations enable row level security;
drop policy if exists "staff read migrations" on public.schema_migrations;
create policy "staff read migrations" on public.schema_migrations
  for select to authenticated using (is_staff());

-- Call at the END of each migration file:
--   select record_migration('24-stripe-events', 'schema', 'stripe idempotency');
create or replace function public.record_migration(
  p_version text, p_kind text default 'schema', p_note text default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.schema_migrations (version, kind, note)
  values (p_version, p_kind, p_note)
  on conflict (version) do update
    set applied_at = now(), kind = excluded.kind, note = coalesce(excluded.note, schema_migrations.note);
end $$;

revoke all on function public.record_migration(text,text,text) from public;

-- ============================================================================
-- VERIFY
--   select version, kind, applied_at from schema_migrations order by version;
-- ============================================================================
select public.record_migration('00-schema-migrations', 'schema', 'migration tracking table + helper');

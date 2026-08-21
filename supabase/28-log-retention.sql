-- ============================================================================
-- 28 · Retention on the log tables (scalability audit — "now" list)
-- ----------------------------------------------------------------------------
-- Three tables accumulate forever. At 100k consumers the third is the concern:
-- client_errors captures uncaught errors and unhandled rejections from every
-- visitor, so ONE bad deploy could write millions of rows in hours.
--
--   priced_orders   one row per checkout ATTEMPT (incl. abandoned) — worthless
--                   after the session can no longer complete.  → delete at 7d
--   client_errors   diagnostic only; value decays fast.          → delete at 90d
--   stripe_events   PAYMENT AUDIT TRAIL — never bulk-deleted here. Archive
--                   deliberately if it ever needs trimming.
--
-- Idempotent. Safe to run now; the functions do nothing until there is old data.
-- ============================================================================

create or replace function public.prune_logs()
returns table (table_name text, deleted bigint)
language plpgsql security definer set search_path = public as $$
declare n bigint;
begin
  -- abandoned / completed checkout snapshots
  delete from public.priced_orders where created_at < now() - interval '7 days';
  get diagnostics n = row_count;
  return query select 'priced_orders'::text, n;

  -- client diagnostics
  delete from public.client_errors where at < now() - interval '90 days';
  get diagnostics n = row_count;
  return query select 'client_errors'::text, n;

  -- stripe_events is deliberately NOT pruned: it is the idempotency ledger and
  -- the payment audit trail. Deleting a row would let an old event be replayed.
end $$;

revoke all on function public.prune_logs() from public;
-- service-role / SQL editor only. No grant to anon or authenticated.

-- ---------------------------------------------------------------------------
-- SCHEDULE (choose one)
--   • Supabase Dashboard → Database → Cron:  select public.prune_logs();  daily
--   • or pg_cron, if enabled on the project:
--       select cron.schedule('aiwine-prune-logs', '30 3 * * *', 'select public.prune_logs()');
--   • or just run it by hand occasionally — nothing breaks if it is late.
-- ---------------------------------------------------------------------------

-- Guard rail: if client_errors is growing unexpectedly fast, something is
-- broken in production and worth looking at BEFORE pruning it away.
--   select date_trunc('day', at) d, kind, count(*)
--     from client_errors group by 1,2 order by 3 desc limit 20;

select public.record_migration('28-log-retention', 'schema', 'prune_logs(): priced_orders 7d, client_errors 90d');

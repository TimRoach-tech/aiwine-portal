-- ============================================================================
-- 29 · Winery app: order fulfilment fields
-- ----------------------------------------------------------------------------
-- The winery app's Orders screen needs to record HOW an order was fulfilled, not
-- just its status. `orders` carries status/total/commission (migration 26) but
-- nothing about the shipment itself, so a winery marking an order shipped has
-- nowhere to put the tracking number the customer will ask for.
--
-- Timestamps are separate from `status` on purpose: status is the current state,
-- these are the audit trail of WHEN each transition happened. That matters for
-- "shipped 3 days ago and still not delivered" and for any future SLA reporting —
-- a single status column can't answer it.
--
-- Idempotent. Run before deploying the app's Orders screen.
-- ============================================================================

alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists carrier         text;
alter table public.orders add column if not exists shipped_at      timestamptz;
alter table public.orders add column if not exists fulfilled_at    timestamptz;

-- The app's default view is "orders needing action" for one winery, newest first.
create index if not exists orders_winery_status_idx
  on public.orders ("wineryId", status, "placedAt" desc);

-- Stamp the timestamps automatically, so they are correct even when the status is
-- changed from the portal, the CRM, or directly in SQL — not just from the app.
create or replace function public.orders_stamp_fulfilment()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'shipped'   and new.shipped_at   is null then new.shipped_at   := now(); end if;
    if new.status = 'delivered' and new.fulfilled_at is null then new.fulfilled_at := now(); end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_orders_stamp_fulfilment on public.orders;
create trigger trg_orders_stamp_fulfilment
  before update of status on public.orders
  for each row execute function public.orders_stamp_fulfilment();

-- ============================================================================
-- RLS: unchanged. `orders` is already scoped per winery by the policy in
-- migration 01 ("winery owns its orders"), so the app's reads and status writes
-- are constrained to the signed-in winery without any new policy here.
--
-- VERIFY
--   select id, status, tracking_number, carrier, shipped_at, fulfilled_at
--     from orders order by "placedAt" desc limit 10;
-- ============================================================================
select public.record_migration('29-winery-app-orders', 'schema', 'tracking/carrier/shipped_at/fulfilled_at + status index + stamp trigger');

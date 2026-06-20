-- ============================================================
-- AIWine Winery Portal — schema + per-winery security (migration 01)
-- Runs against the SAME Supabase database as the CRM.
-- Creates: winery_users (login → winery), orders + order_items,
-- a my_winery() helper, and Row-Level Security so each winery sees
-- ONLY its own wines and orders. Staff (CRM) keep full access.
-- Safe to re-run.
-- ============================================================

-- ---------- 1. map each portal login to one winery ----------
create table if not exists winery_users (
  "userId"    uuid primary key references auth.users(id) on delete cascade,
  "wineryId"  text not null references wineries(id) on delete cascade,
  role        text default 'owner',          -- owner | manager | staff
  "createdAt" timestamptz default now()
);

-- helper: which winery does the current login belong to? (null for staff/none)
create or replace function my_winery()
returns text
language sql stable security definer set search_path = public as $$
  select "wineryId" from winery_users where "userId" = auth.uid() limit 1;
$$;

-- ---------- 2. orders (consumer → winery, direct fulfilment) ----------
create table if not exists orders (
  id           text primary key default ('AW-' || substr(gen_random_uuid()::text,1,6)),
  "wineryId"   text not null references wineries(id) on delete cascade,
  "customerName" text,
  destination  text,                          -- city / region
  total        numeric default 0,
  status       text default 'new',            -- new | packing | shipped | cancelled
  "placedAt"   timestamptz default now(),
  "shippedAt"  timestamptz
);
create index if not exists orders_winery_idx on orders ("wineryId");
create index if not exists orders_status_idx on orders (status);

create table if not exists order_items (
  id         bigint generated always as identity primary key,
  "orderId"  text not null references orders(id) on delete cascade,
  "wineId"   text references wines(id) on delete set null,
  name       text,
  qty        integer default 1,
  price      numeric default 0
);
create index if not exists order_items_order_idx on order_items ("orderId");

-- ---------- 3. Row-Level Security ----------
-- WINES: keep the existing staff policy, ADD a winery-scoped one.
-- (Policies are OR'd, so staff OR the owning winery can act.)
alter table wines enable row level security;
drop policy if exists "winery owns its wines" on wines;
create policy "winery owns its wines" on wines for all to authenticated
  using ("wineryId" = my_winery())
  with check ("wineryId" = my_winery());

-- WINERY_USERS: a login may read only its own mapping; staff manage all.
alter table winery_users enable row level security;
drop policy if exists "self mapping" on winery_users;
create policy "self mapping" on winery_users for select to authenticated
  using ("userId" = auth.uid() or is_staff());
drop policy if exists "staff manage mappings" on winery_users;
create policy "staff manage mappings" on winery_users for all to authenticated
  using (is_staff()) with check (is_staff());

-- ORDERS: the owning winery sees/updates its orders; staff see all.
alter table orders enable row level security;
drop policy if exists "winery owns its orders" on orders;
create policy "winery owns its orders" on orders for all to authenticated
  using ("wineryId" = my_winery() or is_staff())
  with check ("wineryId" = my_winery() or is_staff());

-- ORDER_ITEMS: visible if you can see the parent order.
alter table order_items enable row level security;
drop policy if exists "items follow order" on order_items;
create policy "items follow order" on order_items for all to authenticated
  using (exists (select 1 from orders o where o.id = order_items."orderId"
                 and (o."wineryId" = my_winery() or is_staff())))
  with check (exists (select 1 from orders o where o.id = order_items."orderId"
                 and (o."wineryId" = my_winery() or is_staff())));

-- ============================================================
-- VERIFY (run as a winery login, NOT the service key):
--   select my_winery();                       -- your wineryId, not null
--   select count(*) from wines;               -- ONLY your wines
--   select count(*) from orders;              -- ONLY your orders
-- The critical test: sign in as Winery A and confirm you CANNOT
-- see Winery B's rows. If counts leak, the RLS is wrong — stop.
-- ============================================================

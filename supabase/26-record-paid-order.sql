-- ============================================================================
-- 26 · Transactional order write (audit Critical C1 — the go-live piece)
-- ----------------------------------------------------------------------------
-- WHY A SINGLE RPC: the webhook must record the order, its lines, the commission
-- snapshot AND decrement stock as ONE unit. Doing it as sequential REST calls
-- means a mid-sequence failure leaves an order with no items, or stock sold twice.
-- A plpgsql function runs in one implicit transaction: it all lands, or none of it.
--
-- Multi-winery carts: AIWine ships direct from each winery, and `orders` already
-- has a single non-null "wineryId". So ONE payment produces ONE order row PER
-- WINERY, all sharing a payment reference. That matches how wineries are paid and
-- how the portal already lists orders.
--
-- COMMISSION IS SNAPSHOTTED, never recomputed: a later price or rate change must
-- not rewrite a settled order.
--
-- Idempotency: enforced upstream by claim_stripe_event() (migration 24). This
-- function additionally refuses to write the same payment reference twice, so it
-- is safe even if called directly.
--
-- Depends on: 01-portal-schema.sql (orders, order_items), 24-stripe-events.sql.
-- Idempotent. Run before go-live; harmless now.
-- ============================================================================

-- 1) Columns the payment phase needs -----------------------------------------
alter table public.orders add column if not exists "paymentRef"    text;   -- Stripe session id
alter table public.orders add column if not exists "customerEmail" text;
alter table public.orders add column if not exists address         text;
alter table public.orders add column if not exists method          text default 'deliver'; -- deliver | pickup
alter table public.orders add column if not exists gifts           jsonb;
alter table public.orders add column if not exists postage         numeric default 0;
alter table public.orders add column if not exists discount        numeric default 0;
alter table public.orders add column if not exists "appDiscount"   numeric default 0;
alter table public.orders add column if not exists "promoDiscount" numeric default 0;
alter table public.orders add column if not exists "promoCode"     text;
alter table public.orders add column if not exists gst             numeric default 0;
-- commission snapshot (per winery order, at charge time)
alter table public.orders add column if not exists "commissionRate" numeric;
alter table public.orders add column if not exists commission       numeric;
alter table public.orders add column if not exists "commissionGst"  numeric;
alter table public.orders add column if not exists "wineryNet"      numeric;
alter table public.orders add column if not exists currency         text default 'NZD';

create index if not exists orders_payment_ref_idx on public.orders ("paymentRef");

-- 1b) Priced-order parking table --------------------------------------------
-- Stripe metadata values are capped (~500 chars), so a multi-line order cannot
-- ride along in metadata. checkout-reprice.js writes the SERVER-priced order
-- here and puts only a short `repriceRef` in the session metadata; the webhook
-- reads the snapshot back. This is what guarantees the amount charged and the
-- order recorded came from the same server-side calculation.
create table if not exists public.priced_orders (
  ref         text primary key,
  "order"     jsonb not null,      -- reprice() order object (authoritative)
  customer    jsonb,
  method      text default 'deliver',
  gifts       jsonb,
  promo_code  text,
  user_id     uuid,
  session_id  text,
  created_at  timestamptz default now()
);
create index if not exists priced_orders_session_idx on public.priced_orders (session_id);
create index if not exists priced_orders_created_idx on public.priced_orders (created_at);

-- Written and read only by the service-role key (checkout endpoint + webhook).
alter table public.priced_orders enable row level security;
drop policy if exists "staff read priced orders" on public.priced_orders;
create policy "staff read priced orders" on public.priced_orders
  for select to authenticated using (is_staff());

-- Housekeeping: abandoned snapshots are worthless after a day or two.
-- Run occasionally (or from a cron):
--   delete from priced_orders where created_at < now() - interval '7 days';

-- 2) The transactional write -------------------------------------------------
-- p_order is the `order` object returned by portal/api/_pricing.js reprice():
--   { currency, total, gst, postage, discount, appDiscount, promoDiscount,
--     commission:{rate,total,gst,net},
--     shipments:[ { winery, wineryId, bottles, subtotal, discount, appDiscount,
--                   promoDiscount, postage, wineValue, total, commission,
--                   commissionGst, items:[{id,qty,price}] } ] }
create or replace function public.record_paid_order(
  p_payment_ref text,
  p_order       jsonb,
  p_customer    jsonb default '{}'::jsonb,   -- { name, email, address, destination }
  p_method      text  default 'deliver',
  p_gifts       jsonb default null,
  p_promo_code  text  default null,
  p_user        uuid  default null
) returns text[] language plpgsql security definer set search_path = public as $$
declare
  ship      jsonb;
  item      jsonb;
  new_id    text;
  ids       text[] := '{}';
  rate      numeric := coalesce((p_order->'commission'->>'rate')::numeric, 0.20);
  gst_rate  numeric := 0.15;
  n_updated integer;
begin
  if p_payment_ref is null or btrim(p_payment_ref) = '' then
    raise exception 'payment_ref_required';
  end if;

  -- Already recorded? Return the existing ids and change nothing.
  select array_agg(id) into ids from public.orders where "paymentRef" = p_payment_ref;
  if ids is not null and array_length(ids, 1) > 0 then
    return ids;
  end if;
  ids := '{}';

  for ship in select * from jsonb_array_elements(p_order->'shipments') loop
    if (ship->>'wineryId') is null then
      raise exception 'shipment_missing_winery_id:%', coalesce(ship->>'winery', '?');
    end if;

    insert into public.orders (
      "wineryId", "customerName", "customerEmail", destination, address,
      total, status, "paymentRef", method, gifts,
      postage, discount, "appDiscount", "promoDiscount", "promoCode",
      gst, "commissionRate", commission, "commissionGst", "wineryNet", currency
    ) values (
      ship->>'wineryId',
      p_customer->>'name',
      p_customer->>'email',
      coalesce(p_customer->>'destination', p_customer->>'city'),
      p_customer->>'address',
      (ship->>'total')::numeric,
      'new',
      p_payment_ref,
      coalesce(p_method, 'deliver'),
      p_gifts,
      coalesce((ship->>'postage')::numeric, 0),
      coalesce((ship->>'discount')::numeric, 0),
      coalesce((ship->>'appDiscount')::numeric, 0),
      coalesce((ship->>'promoDiscount')::numeric, 0),
      p_promo_code,
      -- GST is INCLUSIVE in NZ display prices
      round((ship->>'total')::numeric * gst_rate / (1 + gst_rate), 2),
      rate,
      coalesce((ship->>'commission')::numeric, 0),
      coalesce((ship->>'commissionGst')::numeric, 0),
      -- what the winery is owed for wine: their total less postage less commission
      round(coalesce((ship->>'total')::numeric, 0)
            - coalesce((ship->>'postage')::numeric, 0)
            - coalesce((ship->>'commission')::numeric, 0), 2),
      coalesce(p_order->>'currency', 'NZD')
    ) returning id into new_id;

    ids := ids || new_id;

    -- lines + stock, same transaction
    for item in select * from jsonb_array_elements(ship->'items') loop
      insert into public.order_items ("orderId", "wineId", name, qty, price)
      values (
        new_id,
        item->>'id',
        (select w.name from public.wines w where w.id = item->>'id'),
        coalesce((item->>'qty')::integer, 0),
        coalesce((item->>'price')::numeric, 0)
      );

      -- Decrement only if stock is still sufficient. If another order took it
      -- between re-price and payment, fail the WHOLE transaction: the customer
      -- has paid, so this must surface loudly for a refund/partial decision
      -- rather than silently overselling.
      update public.wines
         set stock = stock - coalesce((item->>'qty')::integer, 0)
       where id = item->>'id'
         and stock >= coalesce((item->>'qty')::integer, 0);
      get diagnostics n_updated = row_count;
      if n_updated = 0 then
        raise exception 'oversold:%', item->>'id';
      end if;
    end loop;
  end loop;

  if array_length(ids, 1) is null then
    raise exception 'no_shipments_in_order';
  end if;

  -- Promo redemption is only real once payment succeeded.
  if p_promo_code is not null and p_user is not null then
    begin
      perform public.record_promo_redemption(p_promo_code, p_user, ids[1]);
    exception when others then null;   -- never fail a paid order over a counter
    end;
  end if;

  return ids;
end $$;

revoke all on function public.record_paid_order(text,jsonb,jsonb,text,jsonb,text,uuid) from public;
-- service-role only (the webhook). No grant to anon/authenticated.

-- ============================================================================
-- VERIFY (in a scratch project, or wrap in BEGIN; … ROLLBACK;)
--   select record_paid_order(
--     'cs_test_123',
--     '{"currency":"NZD","commission":{"rate":0.20},
--       "shipments":[{"winery":"Alpha","wineryId":"<real-winery-id>","total":324,
--                     "postage":0,"discount":36,"commission":64.8,"commissionGst":9.72,
--                     "items":[{"id":"<real-wine-id>","qty":12,"price":30}]}]}'::jsonb,
--     '{"name":"Test","email":"t@example.com","destination":"Wellington"}'::jsonb);
--
--   -- calling twice must NOT duplicate:
--   select record_paid_order('cs_test_123', '{...same...}'::jsonb);   -- same ids
--
--   select id, "wineryId", total, commission, "wineryNet", "paymentRef" from orders
--    where "paymentRef" = 'cs_test_123';
-- ============================================================================

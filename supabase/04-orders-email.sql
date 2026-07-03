-- ============================================================
-- AIWine — per-winery order notification email (migration 04)
-- Each winery sets its own fulfilment address (independent of the
-- login), e.g. cellar@grovemill.co.nz vs orders@mtdifficulty.co.nz.
-- The actual send hook arrives with consumer checkout; this stores
-- and secures the address now. Run AFTER 03. Safe to re-run.
-- ============================================================

alter table wineries add column if not exists "ordersEmail" text;

-- a linked user may set the orders email for THEIR winery only
create or replace function set_orders_email(p_winery text, p_email text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if not (is_my_winery(p_winery) or is_staff()) then raise exception 'not_your_winery'; end if;
  if coalesce(trim(p_email),'') <> '' and p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email';
  end if;
  update wineries set "ordersEmail" = nullif(trim(p_email),'') where id = p_winery;
end; $$;
revoke all on function set_orders_email(text,text) from public;
grant execute on function set_orders_email(text,text) to authenticated;

-- VERIFY (as a winery login):
--   select set_orders_email(my_winery(), 'orders@mywinery.co.nz');
--   select "ordersEmail" from wineries where id = my_winery();

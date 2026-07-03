-- ============================================================
-- AIWine — plan activation + codes (migration 05)
-- Server-side truth for the paid upgrades. Set by:
--   · the Stripe webhook  (api/stripe-webhook.js, on payment)
--   · redeem_activation_code()  (association / founding codes)
--   · staff, directly
-- Run AFTER 03 + 04. Safe to re-run.
-- ============================================================

alter table wineries add column if not exists "cellarDoorActive" boolean default false;
alter table wineries add column if not exists "growActive"        boolean default false;
alter table wineries add column if not exists "planActivatedVia"  text;    -- stripe | code:<CODE> | staff

-- ---------- activation codes (staff-managed) ----------
create table if not exists activation_codes (
  code      text primary key,             -- store UPPERCASE
  feature   text not null default 'cellarDoor',   -- cellarDoor | grow
  label     text,
  "maxUses" int,                           -- null = unlimited
  uses      int default 0,
  active    boolean default true
);
alter table activation_codes enable row level security;
drop policy if exists "staff manage codes" on activation_codes;
create policy "staff manage codes" on activation_codes for all to authenticated
  using (is_staff()) with check (is_staff());

insert into activation_codes (code, feature, label, "maxUses") values
  ('FOUNDING49', 'cellarDoor', 'Founding winery', null),
  ('WAIRARAPA',  'cellarDoor', 'Wairarapa Association', null)
on conflict (code) do nothing;

-- ---------- winery redeems a code for one of THEIR wineries ----------
create or replace function redeem_activation_code(p_winery text, p_code text)
returns text language plpgsql security definer set search_path = public as $$
declare c record;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if not (is_my_winery(p_winery) or is_staff()) then raise exception 'not_your_winery'; end if;
  select * into c from activation_codes
    where code = upper(trim(p_code)) and active
      and ("maxUses" is null or uses < "maxUses");
  if not found then raise exception 'invalid_code'; end if;
  update activation_codes set uses = uses + 1 where code = c.code;
  if c.feature = 'grow' then
    update wineries set "growActive" = true,       "planActivatedVia" = 'code:' || c.code where id = p_winery;
  else
    update wineries set "cellarDoorActive" = true, "planActivatedVia" = 'code:' || c.code where id = p_winery;
  end if;
  return c.feature;
end; $$;
revoke all on function redeem_activation_code(text,text) from public;
grant execute on function redeem_activation_code(text,text) to authenticated;

-- VERIFY:
--   select code, feature, uses from activation_codes;   -- 2 seed codes
--   As a winery login: select redeem_activation_code(my_winery(), 'WAIRARAPA');
--   select "cellarDoorActive" from wineries where id = my_winery();  -- true

-- ============================================================
-- 18 · Membership (Connoisseur) + regional promo codes
-- Run in the Supabase SQL editor. Idempotent.
-- ============================================================

-- 1) Membership flag on the consumer profile.
--    true = Connoisseur (gets the 10% member discount, web AND app).
alter table public.profiles add column if not exists member boolean default false;

-- 2) Regional promo codes. Each code carries BOTH its discount and its own
--    validity window, so "5% for a month" or "10% for 2 weeks" is just data.
create table if not exists public.promo_codes (
  code        text primary key,                 -- store UPPERCASE, e.g. WAIRARAPA5
  pct         numeric not null,                 -- percent, e.g. 5 or 10
  label       text,                             -- e.g. "Wairarapa launch"
  region      text,                             -- optional, for reporting
  starts_at   timestamptz default now(),
  expires_at  timestamptz not null,             -- the code's duration lives here
  active      boolean default true,
  "createdAt" timestamptz default now()
);

alter table public.promo_codes enable row level security;

-- Anyone (anon/authenticated) may VALIDATE a code (read only). Writes are staff/
-- service-role only (created in the CRM). Public read is fine — codes are public
-- marketing tokens; the value is the % + window, both enforced below.
drop policy if exists "promo public read" on public.promo_codes;
create policy "promo public read" on public.promo_codes
  for select to anon, authenticated using (true);

-- 3) Validate + resolve a code to its live discount. Returns one row (pct,label,
--    expires_at) when the code is active and within its window, else no rows.
create or replace function public.validate_promo(p_code text)
returns table (code text, pct numeric, label text, expires_at timestamptz)
language sql stable security definer set search_path = public as $$
  select code, pct, label, expires_at
  from public.promo_codes
  where upper(code) = upper(p_code)
    and active = true
    and now() >= starts_at
    and now() <= expires_at;
$$;
grant execute on function public.validate_promo(text) to anon, authenticated;

notify pgrst, 'reload schema';

-- Example codes (create real ones in the CRM):
--   insert into promo_codes (code, pct, label, region, expires_at) values
--     ('WAIRARAPA5', 5, 'Wairarapa launch', 'Wairarapa', now() + interval '1 month');

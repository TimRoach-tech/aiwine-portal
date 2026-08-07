-- ============================================================
-- AIWine — winery fulfilment profile (migration 06)
-- Adds wineries.fulfilment ('any' | 'cases') + a setter RPC so the
-- portal toggle writes through, and the website/app read it live.
-- Safe to re-run.
-- ============================================================

alter table wineries add column if not exists fulfilment text default 'any';

-- guard: only the two known values
alter table wineries drop constraint if exists wineries_fulfilment_chk;
alter table wineries add constraint wineries_fulfilment_chk
  check (fulfilment in ('any', 'cases'));

-- setter: the owning winery (or staff) flips its own profile
create or replace function set_fulfilment(p_winery text, p_profile text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_profile not in ('any', 'cases') then
    raise exception 'invalid_profile';
  end if;
  if p_winery is distinct from my_winery() and not is_staff() then
    raise exception 'not_your_winery';
  end if;
  update wineries set fulfilment = p_profile where id = p_winery;
end;
$$;

grant execute on function set_fulfilment(text, text) to authenticated;

-- The website reads wineries with the anon key (name,region already public);
-- fulfilment rides on the same select policy — no policy change needed.

-- VERIFY (as a winery login):
--   select set_fulfilment(my_winery(), 'cases');
--   select fulfilment from wineries where id = my_winery();   -- 'cases'
-- And with the anon key:
--   /rest/v1/wineries?select=name,fulfilment   -- shows the new value

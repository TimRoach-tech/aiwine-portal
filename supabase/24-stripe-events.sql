-- ============================================================================
-- 24 · Stripe webhook idempotency (audit Critical C4)
-- ----------------------------------------------------------------------------
-- WHY NOW, BEFORE STRIPE: the webhook is currently idempotent only BY LUCK — it
-- sets a boolean feature flag to true, so Stripe's retries are harmless. There is
-- no record of which events have been processed.
--
-- The moment that handler also writes an ORDER and DECREMENTS STOCK (the plan),
-- a retry duplicates the order and double-decrements stock. Stripe retries on any
-- 5xx, and stripe-webhook.js deliberately returns 500 on a database failure — so
-- retries are not an edge case, they are the designed behaviour.
--
-- This table must exist before the webhook writes anything transactional.
-- Idempotent. Safe to run now.
-- ============================================================================

create table if not exists public.stripe_events (
  id            text primary key,          -- Stripe event id, e.g. evt_1AbC…
  type          text,
  session_id    text,
  winery_id     text,
  status        text default 'processed',   -- processed | failed | unmatched
  payload       jsonb,
  received_at   timestamptz default now(),
  completed_at  timestamptz
);

create index if not exists stripe_events_type_idx    on public.stripe_events (type);
create index if not exists stripe_events_status_idx  on public.stripe_events (status);
create index if not exists stripe_events_session_idx on public.stripe_events (session_id);

-- Staff-only via the API; the webhook itself uses the service-role key, which
-- bypasses RLS. Deny-by-default for everyone else (no anon/authenticated policy).
alter table public.stripe_events enable row level security;
drop policy if exists "staff read stripe events" on public.stripe_events;
create policy "staff read stripe events" on public.stripe_events
  for select to authenticated using (is_staff());

-- ----------------------------------------------------------------------------
-- Claim helper: the webhook calls this FIRST. It returns true only for the
-- caller that successfully inserted the event id — every retry gets false and
-- must exit without repeating the side effects.
-- ----------------------------------------------------------------------------
create or replace function public.claim_stripe_event(
  p_id text, p_type text default null, p_session text default null, p_payload jsonb default null
) returns boolean language plpgsql security definer set search_path = public as $$
begin
  insert into public.stripe_events (id, type, session_id, payload, status)
  values (p_id, p_type, p_session, p_payload, 'processing');
  return true;
exception when unique_violation then
  return false;   -- already claimed → this is a retry, do nothing
end $$;

revoke all on function public.claim_stripe_event(text,text,text,jsonb) from public;
-- only the service-role key (the webhook) needs this; no grant to authenticated.

-- ============================================================================
-- VERIFY
--   select claim_stripe_event('evt_test_1','checkout.session.completed',null,null); -- true
--   select claim_stripe_event('evt_test_1','checkout.session.completed',null,null); -- false
--   delete from stripe_events where id = 'evt_test_1';
--
--   -- anything the webhook could not match to a winery/plan (needs follow-up):
--   select id, type, session_id, received_at from stripe_events
--    where status = 'unmatched' order by received_at desc;
-- ============================================================================

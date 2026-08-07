-- ============================================================================
-- AIWine — RLS AUDIT (read-only). Run in Supabase → SQL Editor.
-- Nothing here CHANGES anything. It reports, table by table, whether Row Level
-- Security is ON and what policies exist, so you can confirm every table is
-- locked down before go-live. Run each query, read the notes.
-- ============================================================================

-- 1) Which tables have RLS ENABLED? Anything with rls_enabled = false in the
--    `public` schema is readable/writable by anyone with the anon key — FIX those.
select n.nspname   as schema,
       c.relname   as table,
       c.relrowsecurity  as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relrowsecurity asc, c.relname;   -- unprotected tables float to the top

-- 2) Tables with RLS ON but ZERO policies = NO ONE can read/write them (except
--    the service_role key, which bypasses RLS). If a table you expect the app to
--    read shows up here, it needs at least one policy.
select c.relname as table_with_rls_but_no_policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity = true
  and not exists (
    select 1 from pg_policy p where p.polrelid = c.oid
  )
order by c.relname;

-- 3) Full policy list — every policy, the command it covers, the roles, and the
--    USING / WITH CHECK expressions. Read each: an anon policy with USING (true)
--    means fully public — correct for the public wine directory, WRONG for
--    consumers / orders / winery_users / campaigns / emails etc.
select schemaname as schema,
       tablename  as table,
       policyname as policy,
       cmd        as command,        -- SELECT / INSERT / UPDATE / DELETE / ALL
       roles,                        -- {anon}, {authenticated}, {public}, ...
       qual       as using_expr,     -- row visibility test
       with_check as with_check_expr -- write test
from pg_policies
where schemaname = 'public'
order by tablename, cmd, policyname;

-- 4) EXPECTATION CHECKLIST (compare the output of #3 against these intents):
--    wineries          → anon SELECT of PUBLIC columns only (name/region/etc);
--                        writes = authenticated + owns-winery (winery_users).
--    wines             → anon SELECT of PUBLISHED rows only; writes = owner.
--    winery_users      → SELECT/write only where user_id = auth.uid().
--    orders/order_items→ SELECT only for the winery that owns the order
--                        (via winery_users) OR the consumer who placed it;
--                        NEVER anon.
--    consumers         → SELECT/UPDATE only where id = auth.uid(); NEVER anon.
--    contacts/orgs/opportunities/campaigns/campaign_recipients/emails/
--    activities        → CRM-only. These should have NO anon or authenticated
--                        policy at all — the CRM reaches them exclusively via
--                        the service_role key in the Vercel functions. If any
--                        carries an anon/authenticated SELECT, that is a leak.
--    signup/approval   → per 02-winery-signup-approval.sql intent.

-- 5) Belt-and-braces: list every table that grants anything to `anon`.
--    Everything here is world-readable/writable with the publishable key.
--    It should be a SHORT list: the public wine directory + published wines only.
select tablename as table, policyname as policy, cmd as command, qual as using_expr
from pg_policies
where schemaname = 'public' and 'anon' = any (roles)
order by tablename, cmd;

-- ============================================================================
-- HOW TO READ THE RESULT
--   • Query 1: every public table should be rls_enabled = true.
--   • Query 2: should be empty, OR only tables that truly are service-role-only.
--   • Query 5: should ONLY list wineries (public cols) and wines (published).
--     Anything else granting anon is a finding — tighten or drop that policy.
-- Bring the output back and I'll write the exact ALTER/CREATE POLICY fixes.
-- ============================================================================

-- ============================================================================
-- 27 · Backfill the migration log for everything already applied
-- ----------------------------------------------------------------------------
-- Run ONCE on the live database, AFTER 00-schema-migrations.sql.
--
-- This records what production has already had applied, so from here the log is
-- the truth. It writes NOTHING except log rows — it does not re-run any
-- migration, and it deliberately does not assume the one-off data fixes were
-- applied to any other database.
--
-- IMPORTANT: if you know a particular file was NOT run on this database, delete
-- its line below before executing. Getting this wrong only affects the log, not
-- the schema — but the log is only useful if it is honest.
-- ============================================================================

-- ---- schema migrations (safe to re-run; part of a rebuild) ----------------
select public.record_migration('01-portal-schema',        'schema', 'winery_users, orders, order_items, RLS');
select public.record_migration('02-winery-signup-approval','schema', 'signup queue + approval');
select public.record_migration('03-multi-winery',         'schema', 'one login → many wineries');
select public.record_migration('04-orders-email',         'schema', 'order notification email');
select public.record_migration('05-plan-activation',      'schema', 'plan activation flags');
select public.record_migration('06-fulfilment',           'schema', 'fulfilment profile');
select public.record_migration('10-public-winery-directory','schema','public directory read');
select public.record_migration('12-fix-approve-conflict',  'schema', 'approve: composite key (run BEFORE 12-rls-tighten)');
select public.record_migration('12-rls-tighten',          'schema', 'RLS tighten from the 11 audit');
select public.record_migration('13-store-settings',       'schema', 'per-winery store settings + RPC');
select public.record_migration('13b-store-settings-reload','schema', 'store settings reload');
select public.record_migration('13c-wineries-grant',      'schema', 'wineries grants');
select public.record_migration('13d-volume-tiers',        'schema', 'volume tiers');
select public.record_migration('14-wine-provenance',      'schema', 'created/updated by+at on wines');
select public.record_migration('14-wineries-public-read', 'schema', 'wineries public read');
select public.record_migration('15-wine-why',             'schema', 'wines.why');
select public.record_migration('16-cellar-door',          'schema', 'virtual cellar door fields');
select public.record_migration('16-dedupe-wines-policies','schema', 'de-duplicate wines policies');
select public.record_migration('17-wine-images',          'schema', 'image_url + wine-images bucket');
select public.record_migration('18-membership-promos',    'schema', 'profiles.member + promo_codes');
select public.record_migration('21-multi-request-signups','schema', 'requests keyed (userId, wineryName)');
select public.record_migration('22-fix-winery-delete-fk', 'schema', 'winery delete FK fix');
select public.record_migration('23-winery-id-in-pricing', 'schema', 'index wineryId + unique winery name');
select public.record_migration('24-stripe-events',        'schema', 'webhook idempotency');
select public.record_migration('25-hardening-sweep',      'schema', 'storage scope, promo caps, client_errors');
select public.record_migration('26-record-paid-order',    'schema', 'transactional order write + priced_orders');

-- ---- one-off DATA fixes (do NOT re-run; NOT part of a rebuild) ------------
-- These changed specific rows on THIS database at a point in time. Re-running
-- them on a restored copy is either pointless or harmful.
select public.record_migration('07-remove-grove-from-threechimneys','data','one-off: unlink Grove Mill');
select public.record_migration('08-add-wairarapa26-code', 'data', 'one-off: WAIRARAPA26 promo code');
select public.record_migration('09-remove-sally-test',    'data', 'one-off: remove test account');
select public.record_migration('13-reassign-te-kairanga', 'data', 'one-off: reassign Te Kairanga');
select public.record_migration('19-seed-demo-wineries',   'data', 'one-off: seed 240 directory wineries');

-- ---- read-only diagnostics (never "applied"; run any time) ----------------
select public.record_migration('11-rls-audit',            'diagnostic', 'read-only RLS audit');
select public.record_migration('20-diagnose-signups',     'diagnostic', 'read-only signup diagnosis');

select public.record_migration('27-backfill-migration-log','schema','backfilled the log');

-- ============================================================================
-- VERIFY
--   select kind, count(*) from schema_migrations group by kind;
--   select version, kind, note from schema_migrations order by kind, version;
-- ============================================================================

-- ============================================================
-- AIWine — add the WAIRARAPA26 founding code (migration 08)
-- The Wairarapa launch email tells wineries to enter WAIRARAPA26 to unlock a
-- complimentary Virtual Cellar Door, but only 'WAIRARAPA' was seeded. This adds
-- WAIRARAPA26 (unlimited uses, cellarDoor). Additive + idempotent — 'WAIRARAPA'
-- keeps working too. Run AFTER 05-plan-activation.sql.
-- ============================================================

insert into activation_codes (code, feature, label, "maxUses") values
  ('WAIRARAPA26', 'cellarDoor', 'Wairarapa founding 2026', null)
on conflict (code) do nothing;

-- VERIFY:
--   select code, feature, "maxUses", uses, active from activation_codes order by code;
--   -- expect FOUNDING49, WAIRARAPA, WAIRARAPA26

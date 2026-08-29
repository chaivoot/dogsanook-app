-- ============================================================================
-- dogsanook-app · Training treats
-- Treats used during training carry calories too — for a training brand this
-- can be a big share of the day. Track an estimated kcal/day from treats so the
-- nutrition tab counts total intake (food + treats) against DER, and can flag
-- the "treats ≤ 10% of daily calories" guideline.
-- ============================================================================

alter table public.dogs add column if not exists treat_kcal numeric(6,1);
alter table public.dogs add column if not exists treat_note text;

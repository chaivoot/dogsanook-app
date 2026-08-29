-- ============================================================================
-- dogsanook-app · Body Condition Score + target weight
-- Feeds the nutrition dashboard (RER / DER / BCS / weight-vs-target rings).
-- BCS is the standard 1–9 body-condition scale (5 = ideal).
-- ============================================================================

alter table public.dogs add column if not exists bcs int
  check (bcs between 1 and 9);
alter table public.dogs add column if not exists target_weight_kg numeric(5,2);

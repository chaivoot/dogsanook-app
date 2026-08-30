-- ============================================================================
-- dogsanook-app · Vaccine brand + post-shot reaction
-- Owners like to record the brand (combo vaccines come in several brands, and
-- sticking to the same brand can lower reaction risk) and whether the dog
-- reacted after the shot.
-- ============================================================================

alter table public.vaccinations add column if not exists brand text;
alter table public.vaccinations add column if not exists reaction text;      -- none | mild | severe
alter table public.vaccinations add column if not exists reaction_note text;

-- ============================================================================
-- dogsanook-app · Current food
-- What the dog eats right now, so the nutrition tab can compare actual intake
-- against DER (feeding the right amount?).
-- ============================================================================

alter table public.dogs add column if not exists current_food text;
alter table public.dogs add column if not exists current_food_grams numeric(6,1);
alter table public.dogs add column if not exists current_food_kcal_per_100g numeric(6,1);
alter table public.dogs add column if not exists current_food_meals int;

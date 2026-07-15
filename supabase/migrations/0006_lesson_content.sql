-- ============================================================================
-- dogsanook-app · Per-game guide content
-- Each of the 10 games gets an optional short summary + full guide (markdown).
-- Staff edit these in the admin "คู่มือ" tab; owners read them from game cards.
-- ============================================================================

alter table public.lessons add column if not exists summary text;
alter table public.lessons add column if not exists content text;

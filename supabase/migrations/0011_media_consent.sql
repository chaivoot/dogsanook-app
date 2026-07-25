-- ============================================================================
-- dogsanook-app · Media consent per dog
-- Owner opts in to letting the teacher record photos/videos during training.
-- ============================================================================

alter table public.dogs
  add column if not exists media_consent boolean not null default false;
alter table public.dogs
  add column if not exists media_consent_at timestamptz;
alter table public.dogs
  add column if not exists media_consent_by uuid references public.profiles (id);

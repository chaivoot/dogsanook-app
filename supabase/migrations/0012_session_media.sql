-- ============================================================================
-- dogsanook-app · Support video clips in session_photos
-- ============================================================================

alter table public.session_photos
  add column if not exists media_type text not null default 'image'
    check (media_type in ('image', 'video'));

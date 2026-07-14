-- ============================================================================
-- dogsanook-app · Row Level Security
--
-- Roles:
--   owner            → read/write own dogs + own practice check-ins; read-only
--                      on taught/can_do
--   admin / teacher  → full access (the "staff")
--   pending/blocked  → no data access
-- ============================================================================

-- Helper functions run as SECURITY DEFINER so they can read profiles/dogs
-- without tripping the very policies they support (avoids recursion). --------

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and status = 'allowed'
      and role in ('admin', 'teacher')
  );
$$;

create or replace function public.is_allowed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'allowed'
  );
$$;

create or replace function public.owns_dog(p_dog uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.dogs
    where id = p_dog and owner_id = auth.uid()
  );
$$;

-- Stamp taught_by/at & can_do_by/at automatically, and prevent taught/can_do
-- from being fabricated with someone else's id. -----------------------------
create or replace function public.stamp_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.taught and (tg_op = 'INSERT' or not old.taught) then
    new.taught_at := now();
    new.taught_by := auth.uid();
  elsif not new.taught then
    new.taught_at := null;
    new.taught_by := null;
  end if;

  if new.can_do and (tg_op = 'INSERT' or not old.can_do) then
    new.can_do_at := now();
    new.can_do_by := auth.uid();
  elsif not new.can_do then
    new.can_do_at := null;
    new.can_do_by := null;
  end if;

  return new;
end;
$$;

create trigger stamp_progress_trg
before insert or update on public.dog_lesson_progress
for each row
execute function public.stamp_progress();

-- Enable RLS -----------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.dogs enable row level security;
alter table public.lessons enable row level security;
alter table public.dog_lesson_progress enable row level security;
alter table public.practice_checkins enable row level security;
alter table public.session_photos enable row level security;

-- profiles -------------------------------------------------------------------
-- Everyone can read their own row; staff can read all.
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_staff());

-- Only staff can change profiles (approve users, set roles).
create policy profiles_update_staff on public.profiles
  for update using (public.is_staff()) with check (public.is_staff());

-- dogs -----------------------------------------------------------------------
create policy dogs_select on public.dogs
  for select using (owner_id = auth.uid() or public.is_staff());

create policy dogs_insert on public.dogs
  for insert with check (
    public.is_staff()
    or (public.is_allowed() and owner_id = auth.uid())
  );

create policy dogs_update on public.dogs
  for update using (
    public.is_staff() or (public.is_allowed() and owner_id = auth.uid())
  ) with check (
    public.is_staff() or (public.is_allowed() and owner_id = auth.uid())
  );

create policy dogs_delete on public.dogs
  for delete using (
    public.is_staff() or (public.is_allowed() and owner_id = auth.uid())
  );

-- lessons (read-only reference for any approved user) ------------------------
create policy lessons_select on public.lessons
  for select using (public.is_allowed() or public.is_staff());

-- dog_lesson_progress: owners read only; only staff may write ---------------
create policy dlp_select on public.dog_lesson_progress
  for select using (public.owns_dog(dog_id) or public.is_staff());

create policy dlp_insert_staff on public.dog_lesson_progress
  for insert with check (public.is_staff());

create policy dlp_update_staff on public.dog_lesson_progress
  for update using (public.is_staff()) with check (public.is_staff());

create policy dlp_delete_staff on public.dog_lesson_progress
  for delete using (public.is_staff());

-- practice_checkins: owner logs homework for own dogs; staff full ------------
create policy pc_select on public.practice_checkins
  for select using (public.owns_dog(dog_id) or public.is_staff());

create policy pc_insert on public.practice_checkins
  for insert with check (
    public.is_staff()
    or (owner_id = auth.uid() and public.owns_dog(dog_id))
  );

create policy pc_delete on public.practice_checkins
  for delete using (
    public.is_staff() or (owner_id = auth.uid() and public.owns_dog(dog_id))
  );

-- session_photos: owner reads own dog's photos; only staff may write ---------
create policy sp_select on public.session_photos
  for select using (public.owns_dog(dog_id) or public.is_staff());

create policy sp_insert_staff on public.session_photos
  for insert with check (public.is_staff());

create policy sp_update_staff on public.session_photos
  for update using (public.is_staff()) with check (public.is_staff());

create policy sp_delete_staff on public.session_photos
  for delete using (public.is_staff());

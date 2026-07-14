-- ============================================================================
-- dogsanook-app · initial schema (schema: public)
-- 6 tables + auto-create-profile trigger on first LINE login
-- ============================================================================

create extension if not exists pgcrypto;

-- profiles: 1:1 with auth.users -------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  line_user_id text unique,
  display_name text,
  role text not null default 'owner' check (role in ('admin', 'teacher', 'owner')),
  status text not null default 'pending' check (status in ('pending', 'allowed', 'blocked')),
  created_at timestamptz default now()
);

-- dogs: one owner can have many dogs -------------------------------------------
create table public.dogs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  breed text,
  photo_url text,
  owner_id uuid references public.profiles (id) on delete set null,
  notes text,
  created_at timestamptz default now()
);
create index dogs_owner_id_idx on public.dogs (owner_id);

-- lessons: the 10 games (seeded in 0003) ---------------------------------------
create table public.lessons (
  id int primary key, -- 1..10
  slug text unique,
  name_th text not null,
  sort_order int not null
);

-- dog_lesson_progress: one row per (dog x lesson) ------------------------------
create table public.dog_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid references public.dogs (id) on delete cascade,
  lesson_id int references public.lessons (id),
  taught boolean not null default false, -- teacher: taught
  taught_by uuid references public.profiles (id),
  taught_at timestamptz,
  can_do boolean not null default false, -- teacher: dog can do it
  can_do_by uuid references public.profiles (id),
  can_do_at timestamptz,
  unique (dog_id, lesson_id)
);
create index dlp_dog_id_idx on public.dog_lesson_progress (dog_id);

-- practice_checkins: owner logs homework (count = number of rows) --------------
create table public.practice_checkins (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid references public.dogs (id) on delete cascade,
  lesson_id int references public.lessons (id),
  owner_id uuid references public.profiles (id),
  checked_at timestamptz default now()
);
create index pc_dog_lesson_idx on public.practice_checkins (dog_id, lesson_id);

-- session_photos: training photos uploaded by teachers -------------------------
create table public.session_photos (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid references public.dogs (id) on delete cascade,
  lesson_id int references public.lessons (id), -- nullable
  photo_url text not null,
  caption text,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz default now()
);
create index sp_dog_id_idx on public.session_photos (dog_id);

-- Auto-create a pending profile the first time a user signs in with LINE. -------
-- LINE OIDC exposes the LINE user id as `sub` and the display name as `name`.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, line_user_id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'sub',
      new.raw_user_meta_data ->> 'provider_id',
      new.raw_user_meta_data ->> 'user_id'
    ),
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      'ผู้ใช้ใหม่'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ============================================================================
-- dogsanook-app · Decouple from Supabase Auth
--
-- LINE login and sessions are now handled in the Next.js app; Supabase is used
-- purely as a database via the service role. So profiles are no longer tied to
-- auth.users, and the auth-driven triggers are removed. Authorization is
-- enforced in application code (see lib/auth.ts + server actions).
-- ============================================================================

-- Remove the auth.users → profiles trigger (profiles are created by the app).
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Remove the progress stamp trigger — the app stamps taught_by/at itself now
-- (auth.uid() is null under the service role, so the trigger can't).
drop trigger if exists stamp_progress_trg on public.dog_lesson_progress;
drop function if exists public.stamp_progress();

-- profiles.id: standalone uuid instead of a FK to auth.users.
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles alter column id set default gen_random_uuid();

-- NOTE: the RLS policies from 0002 remain but are bypassed by the service-role
-- client. They're harmless; leaving them in place means the schema is still
-- safe if you ever point an anon client at it.

-- ============================================================================
-- dogsanook-app · Multiple owners per dog
--
-- A household may share a dog (e.g. both "พ่อหมา" and "แม่หมา" want to follow
-- the same dog). Introduce a join table so a dog can have many owners. The
-- existing dogs.owner_id is kept for backward-compat / "who added it" but
-- authorization now reads from dog_owners.
-- ============================================================================

create table public.dog_owners (
  dog_id uuid references public.dogs (id) on delete cascade,
  owner_id uuid references public.profiles (id) on delete cascade,
  added_at timestamptz default now(),
  primary key (dog_id, owner_id)
);
create index dog_owners_owner_idx on public.dog_owners (owner_id);

-- Backfill from current single owners
insert into public.dog_owners (dog_id, owner_id)
select id, owner_id from public.dogs where owner_id is not null
on conflict do nothing;

alter table public.dog_owners enable row level security;

create policy dog_owners_select on public.dog_owners
  for select using (owner_id = auth.uid() or public.is_staff());

create policy dog_owners_write_staff on public.dog_owners
  for all using (public.is_staff()) with check (public.is_staff());

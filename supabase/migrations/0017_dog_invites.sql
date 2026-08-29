-- ============================================================================
-- dogsanook-app · Co-owner invites
-- An owner generates an unguessable invite token (shared as a link / QR).
-- Another logged-in user opens it and joins the dog as a co-owner
-- (many-to-many via dog_owners). Invites can expire, cap uses, or be revoked.
-- ============================================================================

create table if not exists public.dog_invites (
  token text primary key,
  dog_id uuid not null references public.dogs (id) on delete cascade,
  created_by uuid references public.profiles (id),
  created_at timestamptz default now(),
  expires_at timestamptz,
  max_uses int,               -- null = unlimited
  used_count int not null default 0,
  revoked boolean not null default false
);
create index if not exists dog_invites_dog_idx on public.dog_invites (dog_id);

alter table public.dog_invites enable row level security;

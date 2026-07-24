-- ============================================================================
-- dogsanook-app · E-voucher campaigns (collab เช่น รพส. แจกทดลองเรียนฟรี)
--
-- Model: one shared campaign link (slug). Claimer logs in with LINE, fills in
-- their dog's details, and gets a reference code. The claim creates a pending
-- user + dog in the system; staff follow up from the admin Voucher tab.
-- ============================================================================

create table public.voucher_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,          -- used in /claim/<slug>
  name text not null,                 -- e.g. "ทดลองเรียนฟรี 1 คาบ"
  partner text,                       -- e.g. ชื่อ รพส.
  description text,                   -- shown on the claim page
  active boolean not null default true,
  max_claims int,                     -- optional cap (null = unlimited)
  created_at timestamptz default now()
);

create table public.voucher_claims (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.voucher_campaigns (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete cascade,
  dog_id uuid references public.dogs (id) on delete set null,
  code text unique not null,          -- reference code to show at the vet/class
  contact text,                       -- optional phone / contact
  status text not null default 'new'
    check (status in ('new', 'contacted', 'attended', 'expired')),
  created_at timestamptz default now(),
  unique (campaign_id, profile_id)    -- one claim per user per campaign
);
create index voucher_claims_campaign_idx on public.voucher_claims (campaign_id);

alter table public.voucher_campaigns enable row level security;
alter table public.voucher_claims enable row level security;

-- Anyone approved can read active campaigns; staff manage everything.
create policy campaigns_select on public.voucher_campaigns
  for select using (true);
create policy campaigns_write_staff on public.voucher_campaigns
  for all using (public.is_staff()) with check (public.is_staff());

create policy claims_select on public.voucher_claims
  for select using (profile_id = auth.uid() or public.is_staff());
create policy claims_write_staff on public.voucher_claims
  for all using (public.is_staff()) with check (public.is_staff());

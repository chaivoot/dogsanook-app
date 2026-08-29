-- ============================================================================
-- dogsanook-app · Health passport (สมุดสุขภาพน้อง)
-- Expands each dog with the health record the unified หมาสนุก × dogevityfood
-- hub is built around: birthdate/sex, weight, height, body measurements
-- (chest/neck/muzzle — used for sizing when shopping), neuter + activity
-- level (both feed the DER calculation), allergies, and the microchip / BMA
-- registration numbers (optional, capturable by photo).
--
-- Weight is also logged over time (weight_logs) so the app can draw the trend
-- graph, and vaccinations get their own table for the timeline / next-due.
-- ============================================================================

-- --- health fields on the dog -----------------------------------------------
alter table public.dogs add column if not exists sex text
  check (sex in ('male', 'female'));
alter table public.dogs add column if not exists birthdate date;
alter table public.dogs add column if not exists neutered boolean;

-- current snapshot (latest known values; history lives in weight_logs)
alter table public.dogs add column if not exists weight_kg numeric(5,2);
alter table public.dogs add column if not exists height_cm numeric(5,1);
alter table public.dogs add column if not exists chest_cm numeric(5,1);
alter table public.dogs add column if not exists neck_cm numeric(5,1);
alter table public.dogs add column if not exists muzzle_cm numeric(5,1);

-- lifestyle → DER activity factor. 'normal' when unset.
alter table public.dogs add column if not exists activity_level text
  check (activity_level in ('weight_loss', 'senior', 'normal', 'active', 'working', 'puppy'));

-- allergies (free text; empty = none recorded)
alter table public.dogs add column if not exists food_allergies text;
alter table public.dogs add column if not exists drug_allergies text;

-- identity numbers — optional, often captured by photo of the tag/paper
alter table public.dogs add column if not exists microchip_no text;
alter table public.dogs add column if not exists bma_reg_no text;

-- --- weight history (drives the trend graph) --------------------------------
create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  weight_kg numeric(5,2) not null,
  measured_at date not null default current_date,
  logged_by uuid references public.profiles (id),
  created_at timestamptz default now()
);
create index if not exists weight_logs_dog_id_idx
  on public.weight_logs (dog_id, measured_at desc);

-- --- vaccinations (timeline + next-due) -------------------------------------
create table if not exists public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  name text not null,               -- e.g. 'รวม 5 in 1', 'พิษสุนัขบ้า'
  given_on date,
  next_due_on date,
  clinic text,
  logged_by uuid references public.profiles (id),
  created_at timestamptz default now()
);
create index if not exists vaccinations_dog_id_idx
  on public.vaccinations (dog_id, given_on desc);

-- RLS: on for both, but the app reaches them via the service role (which
-- bypasses RLS), same pattern as the rest of the schema.
alter table public.weight_logs enable row level security;
alter table public.vaccinations enable row level security;

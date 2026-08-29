-- ============================================================================
-- dogsanook-app · Referrals (offline-sale friendly)
-- Each user gets a referral code (shared as /r/<code> link or QR). New signups
-- through it are attributed (profiles.referred_by). Because sales happen off
-- app, an admin logs a reward when a referred customer buys — referral_rewards.
-- ============================================================================

alter table public.profiles add column if not exists referral_code text unique;
alter table public.profiles add column if not exists referred_by uuid
  references public.profiles (id);

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referred_id uuid references public.profiles (id) on delete set null,
  amount numeric(10,2),          -- reward/commission amount (optional)
  note text,
  created_by uuid references public.profiles (id),
  created_at timestamptz default now()
);
create index if not exists referral_rewards_referrer_idx
  on public.referral_rewards (referrer_id);

alter table public.referral_rewards enable row level security;

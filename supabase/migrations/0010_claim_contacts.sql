-- ============================================================================
-- dogsanook-app · Separate phone / LINE contact on voucher claims
-- ============================================================================

alter table public.voucher_claims add column if not exists phone text;
alter table public.voucher_claims add column if not exists line_id text;

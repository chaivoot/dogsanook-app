'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomUUID } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { getCurrentProfile } from '@/lib/auth';

function genCode(): string {
  return 'DS-' + randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
}

/** Claim a voucher: creates the claimer's dog + a claim record with a code. */
export async function claimVoucher(formData: FormData) {
  const slug = String(formData.get('slug'));
  const back = `/claim/${slug}`;

  const profile = await getCurrentProfile();
  if (!profile) redirect(`/auth/line/login?next=${back}`);

  const admin = createServiceClient();
  const { data: campaign } = await admin
    .from('voucher_campaigns')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (!campaign || !campaign.active) redirect(back);

  // Already claimed → the page will show the existing code.
  const { data: existing } = await admin
    .from('voucher_claims')
    .select('id')
    .eq('campaign_id', campaign.id)
    .eq('profile_id', profile.id)
    .maybeSingle();
  if (existing) redirect(back);

  // Cap check.
  if (campaign.max_claims != null) {
    const { count } = await admin
      .from('voucher_claims')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id);
    if ((count ?? 0) >= campaign.max_claims) redirect(`${back}?full=1`);
  }

  const dogName = String(formData.get('dogName') ?? '').trim();
  if (!dogName) redirect(back);
  const breed = String(formData.get('breed') ?? '').trim() || null;
  const notes = String(formData.get('notes') ?? '').trim() || null;
  const contact = String(formData.get('contact') ?? '').trim() || null;

  // Create the claimer's dog.
  const { data: dog } = await admin
    .from('dogs')
    .insert({ name: dogName, breed, notes, owner_id: profile.id })
    .select('id')
    .single();
  if (dog) {
    await admin
      .from('dog_owners')
      .insert({ dog_id: dog.id, owner_id: profile.id });
  }

  await admin.from('voucher_claims').insert({
    campaign_id: campaign.id,
    profile_id: profile.id,
    dog_id: dog?.id ?? null,
    code: genCode(),
    contact,
  });

  revalidatePath('/admin');
  redirect(back);
}

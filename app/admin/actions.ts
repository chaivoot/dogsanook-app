'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';
import { getCurrentProfile, isStaff } from '@/lib/auth';
import { uploadDogImage } from '@/lib/storage';

/** Ensures the caller is approved staff before any admin mutation. */
async function ensureStaff(): Promise<boolean> {
  const profile = await getCurrentProfile();
  return isStaff(profile) && profile?.status === 'allowed';
}

// --- User approval -----------------------------------------------------------

export async function setUserStatus(formData: FormData) {
  const me = await getCurrentProfile();
  if (!isStaff(me) || me?.status !== 'allowed') return;
  const profileId = String(formData.get('profileId'));
  const status = String(formData.get('status')); // allowed | blocked | pending
  // Guard: never let staff block/suspend their own account (lock-out).
  if (profileId === me.id && status !== 'allowed') return;
  const admin = createServiceClient();
  await admin.from('profiles').update({ status }).eq('id', profileId);
  revalidatePath('/admin');
}

export async function setUserRole(formData: FormData) {
  const me = await getCurrentProfile();
  if (!isStaff(me) || me?.status !== 'allowed') return;
  const profileId = String(formData.get('profileId'));
  const role = String(formData.get('role')); // admin | teacher | owner
  // Guard: never let staff demote themselves out of staff access.
  if (profileId === me.id && role === 'owner') return;
  const admin = createServiceClient();
  await admin.from('profiles').update({ role }).eq('id', profileId);
  revalidatePath('/admin');
}

// --- Dogs --------------------------------------------------------------------

export async function createDog(formData: FormData) {
  if (!(await ensureStaff())) return;
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  const breed = String(formData.get('breed') ?? '').trim() || null;
  const ownerId = String(formData.get('ownerId') ?? '') || null;

  const admin = createServiceClient();
  const { data: created } = await admin
    .from('dogs')
    .insert({ name, breed, owner_id: ownerId })
    .select('id')
    .single();
  if (!created) return;

  if (ownerId) {
    await admin
      .from('dog_owners')
      .insert({ dog_id: created.id, owner_id: ownerId });
  }

  const file = formData.get('photo') as File | null;
  if (file && file.size > 0) {
    const url = await uploadDogImage(created.id, file);
    if (url) await admin.from('dogs').update({ photo_url: url }).eq('id', created.id);
  }
  revalidatePath('/admin');
}

/** Add an owner (or co-owner) to a dog — a household can share a dog. */
export async function addDogOwner(formData: FormData) {
  if (!(await ensureStaff())) return;
  const dogId = String(formData.get('dogId'));
  const ownerId = String(formData.get('ownerId') ?? '');
  if (!ownerId) return;

  const admin = createServiceClient();
  await admin
    .from('dog_owners')
    .upsert({ dog_id: dogId, owner_id: ownerId }, { onConflict: 'dog_id,owner_id' });

  // keep the legacy dogs.owner_id populated if it was empty
  const { data: dog } = await admin
    .from('dogs')
    .select('owner_id')
    .eq('id', dogId)
    .single();
  if (dog && !dog.owner_id) {
    await admin.from('dogs').update({ owner_id: ownerId }).eq('id', dogId);
  }
  revalidatePath('/admin');
}

/** Remove an owner from a dog. */
export async function removeDogOwner(formData: FormData) {
  if (!(await ensureStaff())) return;
  const dogId = String(formData.get('dogId'));
  const ownerId = String(formData.get('ownerId'));

  const admin = createServiceClient();
  await admin
    .from('dog_owners')
    .delete()
    .eq('dog_id', dogId)
    .eq('owner_id', ownerId);

  // if we removed the legacy primary owner, repoint or clear it
  const { data: dog } = await admin
    .from('dogs')
    .select('owner_id')
    .eq('id', dogId)
    .single();
  if (dog?.owner_id === ownerId) {
    const { data: remaining } = await admin
      .from('dog_owners')
      .select('owner_id')
      .eq('dog_id', dogId)
      .limit(1);
    await admin
      .from('dogs')
      .update({ owner_id: remaining?.[0]?.owner_id ?? null })
      .eq('id', dogId);
  }
  revalidatePath('/admin');
}

/** Staff deletes a dog entirely (cascades to progress / check-ins / photos). */
export async function deleteDogAsAdmin(formData: FormData) {
  if (!(await ensureStaff())) return;
  const dogId = String(formData.get('dogId'));
  const admin = createServiceClient();
  await admin.from('dogs').delete().eq('id', dogId);
  revalidatePath('/admin');
}

export async function updateDogDetails(formData: FormData) {
  if (!(await ensureStaff())) return;
  const dogId = String(formData.get('dogId'));
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  const breed = String(formData.get('breed') ?? '').trim() || null;
  const notes = String(formData.get('notes') ?? '').trim() || null;

  const admin = createServiceClient();
  await admin.from('dogs').update({ name, breed, notes }).eq('id', dogId);
  revalidatePath('/admin');
}

// --- Lesson progress (staff only) -------------------------------------------

async function upsertProgress(
  dogId: string,
  lessonId: number,
  field: 'taught' | 'can_do',
  value: boolean,
  staffId: string,
) {
  const admin = createServiceClient();
  const stamp = value
    ? { [`${field}_at`]: new Date().toISOString(), [`${field}_by`]: staffId }
    : { [`${field}_at`]: null, [`${field}_by`]: null };

  await admin
    .from('dog_lesson_progress')
    .upsert(
      { dog_id: dogId, lesson_id: lessonId, [field]: value, ...stamp },
      { onConflict: 'dog_id,lesson_id' },
    );
  revalidatePath('/admin');
}

export async function toggleTaught(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!isStaff(profile) || profile?.status !== 'allowed') return;
  const dogId = String(formData.get('dogId'));
  const lessonId = Number(formData.get('lessonId'));
  const value = formData.get('value') === 'true';
  await upsertProgress(dogId, lessonId, 'taught', value, profile.id);
}

export async function toggleCanDo(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!isStaff(profile) || profile?.status !== 'allowed') return;
  const dogId = String(formData.get('dogId'));
  const lessonId = Number(formData.get('lessonId'));
  const value = formData.get('value') === 'true';
  await upsertProgress(dogId, lessonId, 'can_do', value, profile.id);
}

// --- Lesson guide content ----------------------------------------------------

export async function updateLessonContent(formData: FormData) {
  if (!(await ensureStaff())) return;
  const lessonId = Number(formData.get('lessonId'));
  const summary = String(formData.get('summary') ?? '').trim() || null;
  const content = String(formData.get('content') ?? '').trim() || null;

  const admin = createServiceClient();
  await admin.from('lessons').update({ summary, content }).eq('id', lessonId);
  revalidatePath('/admin');
  revalidatePath('/games', 'layout');
}

// --- Vouchers ----------------------------------------------------------------

export async function createCampaign(formData: FormData) {
  if (!(await ensureStaff())) return;
  const name = String(formData.get('name') ?? '').trim();
  const slugRaw = String(formData.get('slug') ?? '').trim().toLowerCase();
  const slug = slugRaw.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  if (!name || !slug) return;
  const partner = String(formData.get('partner') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;
  const maxRaw = String(formData.get('max_claims') ?? '').trim();
  const max_claims = maxRaw ? Number(maxRaw) : null;

  const admin = createServiceClient();
  await admin
    .from('voucher_campaigns')
    .insert({ name, slug, partner, description, max_claims });
  revalidatePath('/admin');
}

export async function updateCampaign(formData: FormData) {
  if (!(await ensureStaff())) return;
  const id = String(formData.get('campaignId'));
  const name = String(formData.get('name') ?? '').trim();
  const slugRaw = String(formData.get('slug') ?? '').trim().toLowerCase();
  const slug = slugRaw.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  if (!name || !slug) return;
  const partner = String(formData.get('partner') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;
  const maxRaw = String(formData.get('max_claims') ?? '').trim();
  const max_claims = maxRaw ? Number(maxRaw) : null;

  const admin = createServiceClient();
  await admin
    .from('voucher_campaigns')
    .update({ name, slug, partner, description, max_claims })
    .eq('id', id);
  revalidatePath('/admin');
}

export async function toggleCampaign(formData: FormData) {
  if (!(await ensureStaff())) return;
  const id = String(formData.get('campaignId'));
  const active = formData.get('active') === 'true';
  const admin = createServiceClient();
  await admin.from('voucher_campaigns').update({ active }).eq('id', id);
  revalidatePath('/admin');
}

export async function setClaimStatus(formData: FormData) {
  if (!(await ensureStaff())) return;
  const id = String(formData.get('claimId'));
  const status = String(formData.get('status'));
  const admin = createServiceClient();
  await admin.from('voucher_claims').update({ status }).eq('id', id);
  revalidatePath('/admin');
}

// --- Session photos ----------------------------------------------------------

export async function uploadSessionPhoto(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!isStaff(profile) || profile?.status !== 'allowed') return;

  const dogId = String(formData.get('dogId'));
  const lessonRaw = String(formData.get('lessonId') ?? '');
  const lessonId = lessonRaw ? Number(lessonRaw) : null;
  const caption = String(formData.get('caption') ?? '').trim() || null;
  const file = formData.get('photo') as File | null;
  if (!file || file.size === 0) return;

  const url = await uploadDogImage(dogId, file, 'session');
  if (!url) return;

  const admin = createServiceClient();
  await admin.from('session_photos').insert({
    dog_id: dogId,
    lesson_id: lessonId,
    photo_url: url,
    caption,
    uploaded_by: profile.id,
  });
  revalidatePath('/admin');
}

export async function deleteSessionPhoto(formData: FormData) {
  if (!(await ensureStaff())) return;
  const id = String(formData.get('photoId'));
  const admin = createServiceClient();
  await admin.from('session_photos').delete().eq('id', id);
  revalidatePath('/admin');
}

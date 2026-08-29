'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { getCurrentProfile, isStaff } from '@/lib/auth';
import { uploadDogImage } from '@/lib/storage';

/** Confirms the current approved user owns/co-owns `dogId`; returns their id. */
async function requireDogOwner(dogId: string): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== 'allowed') return null;

  const admin = createServiceClient();
  const { data: link } = await admin
    .from('dog_owners')
    .select('owner_id')
    .eq('dog_id', dogId)
    .eq('owner_id', profile.id)
    .maybeSingle();

  return link ? profile.id : null;
}

/** Owner logs one homework practice for a lesson. */
export async function checkinLesson(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const lessonId = Number(formData.get('lessonId'));

  const ownerId = await requireDogOwner(dogId);
  if (!ownerId) return;

  const admin = createServiceClient();
  await admin.from('practice_checkins').insert({
    dog_id: dogId,
    lesson_id: lessonId,
    owner_id: ownerId,
  });

  revalidatePath('/dashboard');
}

/** Undo the most recent check-in for a lesson. */
export async function undoCheckin(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const lessonId = Number(formData.get('lessonId'));

  const ownerId = await requireDogOwner(dogId);
  if (!ownerId) return;

  const admin = createServiceClient();
  const { data } = await admin
    .from('practice_checkins')
    .select('id')
    .eq('dog_id', dogId)
    .eq('lesson_id', lessonId)
    .order('checked_at', { ascending: false })
    .limit(1);

  const last = data?.[0]?.id;
  if (last) {
    await admin.from('practice_checkins').delete().eq('id', last);
  }

  revalidatePath('/dashboard');
}

/** Parse a form value as a positive number, or null when blank/invalid. */
function num(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? '').trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Parse a select whose blank/absent value means "leave unset". */
function opt(formData: FormData, key: string): string | null {
  const raw = String(formData.get(key) ?? '').trim();
  return raw || null;
}

/** Owner adds a new dog to their own account (with an optional photo). */
export async function addDog(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== 'allowed') return;

  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  const breed = String(formData.get('breed') ?? '').trim() || null;
  // Optional health basics captured at creation time.
  const sex = opt(formData, 'sex');
  const birthdate = opt(formData, 'birthdate');
  const weight = num(formData, 'weight_kg');

  const admin = createServiceClient();
  const { data: created } = await admin
    .from('dogs')
    .insert({
      name,
      breed,
      owner_id: profile.id,
      sex: sex === 'male' || sex === 'female' ? sex : null,
      birthdate,
      weight_kg: weight,
    })
    .select('id')
    .single();
  if (!created) return;

  // Seed the weight history so the trend graph starts from day one.
  if (weight != null) {
    await admin.from('weight_logs').insert({
      dog_id: created.id,
      weight_kg: weight,
      logged_by: profile.id,
    });
  }

  // Register the creator as an owner in the join table.
  await admin
    .from('dog_owners')
    .insert({ dog_id: created.id, owner_id: profile.id });

  const file = formData.get('photo') as File | null;
  if (file && file.size > 0) {
    const url = await uploadDogImage(created.id, file);
    if (url) await admin.from('dogs').update({ photo_url: url }).eq('id', created.id);
  }

  revalidatePath('/dashboard');
}

/** Owner edits their own dog's details (name / breed / notes). */
export async function updateDog(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const ownerId = await requireDogOwner(dogId);
  if (!ownerId) return;

  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  const breed = String(formData.get('breed') ?? '').trim() || null;
  const notes = String(formData.get('notes') ?? '').trim() || null;

  const admin = createServiceClient();
  await admin.from('dogs').update({ name, breed, notes }).eq('id', dogId);

  revalidatePath('/dashboard');
}

/** Owner uploads their own training photo for a lesson. */
export async function uploadOwnerPhoto(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const ownerId = await requireDogOwner(dogId);
  if (!ownerId) return;

  const lessonRaw = String(formData.get('lessonId') ?? '');
  const lessonId = lessonRaw ? Number(lessonRaw) : null;
  const file = formData.get('photo') as File | null;
  if (!file || file.size === 0) return;

  const url = await uploadDogImage(dogId, file, 'session');
  if (!url) return;

  const admin = createServiceClient();
  await admin.from('session_photos').insert({
    dog_id: dogId,
    lesson_id: lessonId,
    photo_url: url,
    uploaded_by: ownerId,
  });
  revalidatePath('/dashboard');
}

/** Owner deletes a training photo they uploaded themselves. */
export async function deleteOwnerPhoto(formData: FormData) {
  const photoId = String(formData.get('photoId'));

  const profile = await getCurrentProfile();
  if (!profile || profile.status !== 'allowed') return;

  const admin = createServiceClient();
  // Only delete a photo the caller uploaded, on a dog they own.
  const { data: photo } = await admin
    .from('session_photos')
    .select('id, dog_id, uploaded_by')
    .eq('id', photoId)
    .maybeSingle();
  if (!photo || photo.uploaded_by !== profile.id) return;
  if (!(await requireDogOwner(photo.dog_id))) return;

  await admin.from('session_photos').delete().eq('id', photoId);
  revalidatePath('/dashboard');
}

/** Opt a dog in / out of letting the teacher record photos & videos.
 *  Allowed for an owner of the dog, or staff (e.g. recording verbal consent). */
export async function setMediaConsent(formData: FormData) {
  const dogId = String(formData.get('dogId'));

  const profile = await getCurrentProfile();
  if (!profile || profile.status !== 'allowed') return;
  const actorId = isStaff(profile)
    ? profile.id
    : await requireDogOwner(dogId);
  if (!actorId) {
    console.error('[setMediaConsent] not authorized for dog', dogId);
    redirect(`/dashboard?dog=${dogId}&mc=auth`);
  }

  const consent = formData.get('consent') === 'true';

  const admin = createServiceClient();
  const { error } = await admin
    .from('dogs')
    .update({
      media_consent: consent,
      media_consent_at: consent ? new Date().toISOString() : null,
      media_consent_by: consent ? actorId : null,
    })
    .eq('id', dogId);

  revalidatePath('/dashboard');
  revalidatePath('/admin');

  if (error) {
    console.error('[setMediaConsent] update failed:', error.message);
    redirect(`/dashboard?dog=${dogId}&mc=err`);
  }
  redirect(`/dashboard?dog=${dogId}&mc=ok`);
}

/** Owner deletes their own dog (cascades to progress / check-ins / photos). */
export async function deleteDog(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const ownerId = await requireDogOwner(dogId);
  if (!ownerId) return;

  const admin = createServiceClient();
  await admin.from('dogs').delete().eq('id', dogId);

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

/** Owner edits the full health passport (measurements, allergies, ids, …).
 *  Logs a weight-history point whenever the weight is set or changed. */
export async function saveDogHealth(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const ownerId = await requireDogOwner(dogId);
  if (!ownerId) return;

  const admin = createServiceClient();

  // read prior weight so we only log a history point on an actual change
  const { data: prev } = await admin
    .from('dogs')
    .select('weight_kg')
    .eq('id', dogId)
    .maybeSingle();

  const sex = opt(formData, 'sex');
  const neuteredRaw = opt(formData, 'neutered'); // 'yes' | 'no' | null
  const activity = opt(formData, 'activity_level');
  const weight = num(formData, 'weight_kg');

  await admin
    .from('dogs')
    .update({
      sex: sex === 'male' || sex === 'female' ? sex : null,
      birthdate: opt(formData, 'birthdate'),
      neutered: neuteredRaw === 'yes' ? true : neuteredRaw === 'no' ? false : null,
      weight_kg: weight,
      height_cm: num(formData, 'height_cm'),
      chest_cm: num(formData, 'chest_cm'),
      neck_cm: num(formData, 'neck_cm'),
      muzzle_cm: num(formData, 'muzzle_cm'),
      activity_level: activity,
      food_allergies: opt(formData, 'food_allergies'),
      drug_allergies: opt(formData, 'drug_allergies'),
      microchip_no: opt(formData, 'microchip_no'),
      bma_reg_no: opt(formData, 'bma_reg_no'),
      bcs: num(formData, 'bcs'),
      target_weight_kg: num(formData, 'target_weight_kg'),
    })
    .eq('id', dogId);

  const prevWeight = prev?.weight_kg == null ? null : Number(prev.weight_kg);
  if (weight != null && weight !== prevWeight) {
    await admin.from('weight_logs').insert({
      dog_id: dogId,
      weight_kg: weight,
      logged_by: ownerId,
    });
  }

  revalidatePath('/dashboard');
  redirect(`/dashboard?dog=${dogId}&health=ok`);
}

/** Owner records what the dog currently eats (compared against DER). */
export async function saveCurrentFood(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const ownerId = await requireDogOwner(dogId);
  if (!ownerId) return;

  const meals = num(formData, 'current_food_meals');

  const admin = createServiceClient();
  await admin
    .from('dogs')
    .update({
      current_food: opt(formData, 'current_food'),
      current_food_grams: num(formData, 'current_food_grams'),
      current_food_kcal_per_100g: num(formData, 'current_food_kcal_per_100g'),
      current_food_meals: meals == null ? null : Math.round(meals),
      treat_kcal: num(formData, 'treat_kcal'),
      treat_note: opt(formData, 'treat_note'),
    })
    .eq('id', dogId);

  revalidatePath('/dashboard');
  redirect(`/dashboard?tab=nutrition&dog=${dogId}&food=ok`);
}

/** Owner logs a single weight measurement (drives the trend graph). */
export async function logWeight(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const ownerId = await requireDogOwner(dogId);
  if (!ownerId) return;

  const weight = num(formData, 'weight_kg');
  if (weight == null || weight === 0) return;
  const measuredAt = opt(formData, 'measured_at');

  const admin = createServiceClient();
  await admin.from('weight_logs').insert({
    dog_id: dogId,
    weight_kg: weight,
    measured_at: measuredAt ?? undefined,
    logged_by: ownerId,
  });
  // keep the dog's current snapshot in sync
  await admin.from('dogs').update({ weight_kg: weight }).eq('id', dogId);

  revalidatePath('/dashboard');
}

/** Owner adds a vaccination record for the timeline. */
export async function addVaccination(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const ownerId = await requireDogOwner(dogId);
  if (!ownerId) return;

  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;

  const admin = createServiceClient();
  await admin.from('vaccinations').insert({
    dog_id: dogId,
    name,
    given_on: opt(formData, 'given_on'),
    next_due_on: opt(formData, 'next_due_on'),
    clinic: opt(formData, 'clinic'),
    logged_by: ownerId,
  });

  revalidatePath('/dashboard');
}

/** Owner deletes a vaccination record. */
export async function deleteVaccination(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const vaccId = String(formData.get('vaccId'));
  const ownerId = await requireDogOwner(dogId);
  if (!ownerId) return;

  const admin = createServiceClient();
  await admin.from('vaccinations').delete().eq('id', vaccId).eq('dog_id', dogId);

  revalidatePath('/dashboard');
}

/** Owner creates a co-owner invite (link/QR), valid 14 days. */
export async function createDogInvite(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const ownerId = await requireDogOwner(dogId);
  if (!ownerId) return;

  const token = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '');
  const expires = new Date();
  expires.setDate(expires.getDate() + 14);

  const admin = createServiceClient();
  await admin.from('dog_invites').insert({
    token,
    dog_id: dogId,
    created_by: ownerId,
    expires_at: expires.toISOString(),
  });

  revalidatePath('/dashboard');
}

/** Owner revokes an invite. */
export async function revokeDogInvite(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const token = String(formData.get('token'));
  const ownerId = await requireDogOwner(dogId);
  if (!ownerId) return;

  const admin = createServiceClient();
  await admin
    .from('dog_invites')
    .update({ revoked: true })
    .eq('token', token)
    .eq('dog_id', dogId);

  revalidatePath('/dashboard');
}

/** A logged-in user accepts an invite and becomes a co-owner of the dog. */
export async function acceptDogInvite(formData: FormData) {
  const token = String(formData.get('token'));

  const profile = await getCurrentProfile();
  if (!profile || profile.status !== 'allowed') {
    redirect(`/invite/${token}?e=auth`);
  }

  const admin = createServiceClient();
  const { data: invite } = await admin
    .from('dog_invites')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  // Validate the invite is still usable.
  const bad =
    !invite ||
    invite.revoked ||
    (invite.expires_at && new Date(invite.expires_at) < new Date()) ||
    (invite.max_uses != null && invite.used_count >= invite.max_uses);
  if (bad) redirect(`/invite/${token}?e=invalid`);

  const dogId = invite.dog_id as string;

  // Skip if already an owner; otherwise add the co-owner link.
  const { data: existing } = await admin
    .from('dog_owners')
    .select('owner_id')
    .eq('dog_id', dogId)
    .eq('owner_id', profile.id)
    .maybeSingle();

  if (!existing) {
    await admin.from('dog_owners').insert({ dog_id: dogId, owner_id: profile.id });
    await admin
      .from('dog_invites')
      .update({ used_count: (invite.used_count ?? 0) + 1 })
      .eq('token', token);
  }

  revalidatePath('/dashboard');
  redirect(`/dashboard?tab=info&dog=${dogId}&joined=1`);
}

/** Owner uploads / replaces their dog's profile photo. */
export async function updateDogPhoto(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const ownerId = await requireDogOwner(dogId);
  if (!ownerId) return;

  const file = formData.get('photo') as File | null;
  const url = await uploadDogImage(dogId, file);
  if (!url) return;

  const admin = createServiceClient();
  await admin.from('dogs').update({ photo_url: url }).eq('id', dogId);
  revalidatePath('/dashboard');
}

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { getCurrentProfile } from '@/lib/auth';
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

/** Owner adds a new dog to their own account (with an optional photo). */
export async function addDog(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== 'allowed') return;

  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  const breed = String(formData.get('breed') ?? '').trim() || null;

  const admin = createServiceClient();
  const { data: created } = await admin
    .from('dogs')
    .insert({ name, breed, owner_id: profile.id })
    .select('id')
    .single();
  if (!created) return;

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

/** Owner opts in / out of letting the teacher record photos & videos. */
export async function setMediaConsent(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const ownerId = await requireDogOwner(dogId);
  if (!ownerId) return;
  const consent = formData.get('consent') === 'true';

  const admin = createServiceClient();
  await admin
    .from('dogs')
    .update({
      media_consent: consent,
      media_consent_at: consent ? new Date().toISOString() : null,
      media_consent_by: consent ? ownerId : null,
    })
    .eq('id', dogId);

  revalidatePath('/dashboard');
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

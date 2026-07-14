'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';
import { getCurrentProfile } from '@/lib/auth';
import { STORAGE_BUCKET } from '@/lib/types';

/** Confirms the current approved user owns `dogId`; returns their profile id. */
async function requireDogOwner(dogId: string): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== 'allowed') return null;

  const admin = createServiceClient();
  const { data: dog } = await admin
    .from('dogs')
    .select('owner_id')
    .eq('id', dogId)
    .single();

  if (!dog || dog.owner_id !== profile.id) return null;
  return profile.id;
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

/** Owner adds a new dog to their own account. */
export async function addDog(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== 'allowed') return;

  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  const breed = String(formData.get('breed') ?? '').trim() || null;

  const admin = createServiceClient();
  await admin.from('dogs').insert({ name, breed, owner_id: profile.id });

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

/** Owner uploads / replaces their dog's profile photo. */
export async function updateDogPhoto(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const ownerId = await requireDogOwner(dogId);
  if (!ownerId) return;

  const file = formData.get('photo') as File | null;
  if (!file || file.size === 0) return;

  const admin = createServiceClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `dogs/${dogId}/profile-${Date.now()}.${ext}`;

  const { error } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true });
  if (error) return;

  const {
    data: { publicUrl },
  } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  await admin.from('dogs').update({ photo_url: publicUrl }).eq('id', dogId);
  revalidatePath('/dashboard');
}

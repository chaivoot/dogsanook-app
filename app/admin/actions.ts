'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { STORAGE_BUCKET } from '@/lib/types';

// --- User approval -----------------------------------------------------------

export async function setUserStatus(formData: FormData) {
  const profileId = String(formData.get('profileId'));
  const status = String(formData.get('status')); // allowed | blocked | pending
  const supabase = createClient();
  await supabase.from('profiles').update({ status }).eq('id', profileId);
  revalidatePath('/admin');
}

export async function setUserRole(formData: FormData) {
  const profileId = String(formData.get('profileId'));
  const role = String(formData.get('role')); // admin | teacher | owner
  const supabase = createClient();
  await supabase.from('profiles').update({ role }).eq('id', profileId);
  revalidatePath('/admin');
}

// --- Dogs --------------------------------------------------------------------

export async function createDog(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  const breed = String(formData.get('breed') ?? '').trim() || null;
  const ownerId = String(formData.get('ownerId') ?? '') || null;

  const supabase = createClient();
  await supabase.from('dogs').insert({ name, breed, owner_id: ownerId });
  revalidatePath('/admin');
}

export async function assignDogOwner(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const ownerId = String(formData.get('ownerId') ?? '') || null;
  const supabase = createClient();
  await supabase.from('dogs').update({ owner_id: ownerId }).eq('id', dogId);
  revalidatePath('/admin');
}

export async function updateDogDetails(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  const breed = String(formData.get('breed') ?? '').trim() || null;
  const notes = String(formData.get('notes') ?? '').trim() || null;

  const supabase = createClient();
  await supabase
    .from('dogs')
    .update({ name, breed, notes })
    .eq('id', dogId);
  revalidatePath('/admin');
}

// --- Lesson progress (staff only) -------------------------------------------

async function upsertProgress(
  dogId: string,
  lessonId: number,
  field: 'taught' | 'can_do',
  value: boolean,
) {
  const supabase = createClient();
  await supabase
    .from('dog_lesson_progress')
    .upsert(
      { dog_id: dogId, lesson_id: lessonId, [field]: value },
      { onConflict: 'dog_id,lesson_id' },
    );
  revalidatePath('/admin');
}

export async function toggleTaught(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const lessonId = Number(formData.get('lessonId'));
  const value = formData.get('value') === 'true';
  await upsertProgress(dogId, lessonId, 'taught', value);
}

export async function toggleCanDo(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const lessonId = Number(formData.get('lessonId'));
  const value = formData.get('value') === 'true';
  await upsertProgress(dogId, lessonId, 'can_do', value);
}

// --- Session photos ----------------------------------------------------------

export async function uploadSessionPhoto(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const lessonRaw = String(formData.get('lessonId') ?? '');
  const lessonId = lessonRaw ? Number(lessonRaw) : null;
  const caption = String(formData.get('caption') ?? '').trim() || null;
  const file = formData.get('photo') as File | null;
  if (!file || file.size === 0) return;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ext = file.name.split('.').pop() || 'jpg';
  const path = `sessions/${dogId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file);
  if (error) return;

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  await supabase.from('session_photos').insert({
    dog_id: dogId,
    lesson_id: lessonId,
    photo_url: publicUrl,
    caption,
    uploaded_by: user?.id ?? null,
  });
  revalidatePath('/admin');
}

export async function deleteSessionPhoto(formData: FormData) {
  const id = String(formData.get('photoId'));
  const supabase = createClient();
  await supabase.from('session_photos').delete().eq('id', id);
  revalidatePath('/admin');
}

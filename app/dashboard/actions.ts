'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { STORAGE_BUCKET } from '@/lib/types';

/** Owner logs one homework practice for a lesson. */
export async function checkinLesson(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const lessonId = Number(formData.get('lessonId'));

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('practice_checkins').insert({
    dog_id: dogId,
    lesson_id: lessonId,
    owner_id: user.id,
  });

  revalidatePath('/dashboard');
}

/** Undo the most recent check-in for a lesson. */
export async function undoCheckin(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const lessonId = Number(formData.get('lessonId'));

  const supabase = createClient();
  const { data } = await supabase
    .from('practice_checkins')
    .select('id')
    .eq('dog_id', dogId)
    .eq('lesson_id', lessonId)
    .order('checked_at', { ascending: false })
    .limit(1);

  const last = data?.[0]?.id;
  if (last) {
    await supabase.from('practice_checkins').delete().eq('id', last);
  }

  revalidatePath('/dashboard');
}

/** Owner adds a new dog to their own account. */
export async function addDog(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;
  const breed = String(formData.get('breed') ?? '').trim() || null;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('dogs')
    .insert({ name, breed, owner_id: user.id });

  revalidatePath('/dashboard');
}

/** Owner edits their own dog's details (name / breed / notes). */
export async function updateDog(formData: FormData) {
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

  revalidatePath('/dashboard');
}

/** Owner uploads / replaces their dog's profile photo. */
export async function updateDogPhoto(formData: FormData) {
  const dogId = String(formData.get('dogId'));
  const file = formData.get('photo') as File | null;
  if (!file || file.size === 0) return;

  const supabase = createClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `dogs/${dogId}/profile-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true });
  if (error) return;

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  await supabase.from('dogs').update({ photo_url: publicUrl }).eq('id', dogId);
  revalidatePath('/dashboard');
}

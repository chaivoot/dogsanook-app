'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';
import { getCurrentProfile, isStaff } from '@/lib/auth';
import { STORAGE_BUCKET } from '@/lib/types';

/**
 * Direct-to-storage media uploads (photos + video clips). The file is uploaded
 * from the browser straight to Supabase Storage via a signed URL, bypassing
 * Vercel's 4.5MB serverless request limit. These actions only mint the signed
 * URL and record the DB row — the bytes never pass through the function.
 */

/** Allowed to add media for this dog? staff, or an owner of the dog. */
async function authorize(dogId: string): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== 'allowed') return null;
  if (isStaff(profile)) return profile.id;

  const admin = createServiceClient();
  const { data } = await admin
    .from('dog_owners')
    .select('owner_id')
    .eq('dog_id', dogId)
    .eq('owner_id', profile.id)
    .maybeSingle();
  return data ? profile.id : null;
}

export async function createMediaUploadUrl(input: {
  dogId: string;
  ext: string;
}): Promise<{ path: string; token: string } | { error: string }> {
  const who = await authorize(input.dogId);
  if (!who) return { error: 'unauthorized' };

  const ext = (input.ext || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const path = `dogs/${input.dogId}/media-${randomUUID()}.${ext}`;

  const admin = createServiceClient();
  const { data, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) return { error: 'sign_failed' };

  return { path: data.path, token: data.token };
}

export async function recordSessionMedia(input: {
  dogId: string;
  lessonId: number | null;
  path: string;
  mediaType: 'image' | 'video';
  caption?: string | null;
}): Promise<{ ok: true } | { error: string }> {
  const who = await authorize(input.dogId);
  if (!who) return { error: 'unauthorized' };

  const admin = createServiceClient();
  const {
    data: { publicUrl },
  } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(input.path);

  const { error } = await admin.from('session_photos').insert({
    dog_id: input.dogId,
    lesson_id: input.lessonId,
    photo_url: publicUrl,
    media_type: input.mediaType,
    caption: input.caption?.trim() || null,
    uploaded_by: who,
  });
  if (error) return { error: 'record_failed' };

  revalidatePath('/dashboard');
  revalidatePath('/admin');
  return { ok: true };
}

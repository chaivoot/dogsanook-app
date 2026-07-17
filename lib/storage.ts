import { createServiceClient } from '@/lib/supabase/service';
import { STORAGE_BUCKET } from '@/lib/types';

/**
 * Uploads a dog image to the public storage bucket and returns its public URL,
 * or null if there's no file / the upload fails. Server-only.
 */
export async function uploadDogImage(
  dogId: string,
  file: File | null,
  kind: 'profile' | 'session' = 'profile',
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const admin = createServiceClient();
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `dogs/${dogId}/${kind}-${Date.now()}.${ext}`;

  const { error } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });
  if (error) {
    console.error('[storage] dog image upload failed:', error.message);
    return null;
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return publicUrl;
}

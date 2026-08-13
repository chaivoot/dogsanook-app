'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { STORAGE_BUCKET } from '@/lib/types';
import { createMediaUploadUrl, setDogProfilePhoto } from '@/app/_actions/media';

/** Upload/replace a dog's profile photo, straight to storage (no size limit
 *  from the serverless function). Works for owners and staff. */
export default function ProfilePhotoUploader({ dogId }: { dogId: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const MAX_MB = 15;

  async function handleFile(file: File) {
    setErr(null);
    setDone(false);

    if (!file.type.startsWith('image')) {
      setErr('เลือกไฟล์รูปภาพเท่านั้น');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    const mb = file.size / (1024 * 1024);
    if (mb > MAX_MB) {
      setErr(`รูปใหญ่เกินไป (${mb.toFixed(0)}MB) · สูงสุด ${MAX_MB}MB`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setBusy(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const signed = await createMediaUploadUrl({ dogId, ext });
      if ('error' in signed) throw new Error(signed.error);

      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .uploadToSignedUrl(signed.path, signed.token, file, {
          contentType: file.type || undefined,
        });
      if (upErr) throw upErr;

      const res = await setDogProfilePhoto({ dogId, path: signed.path });
      if ('error' in res) throw new Error(res.error);

      setDone(true);
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    } catch {
      setErr('อัปโหลดไม่สำเร็จ ลองใหม่');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
        className="block w-full text-sm text-brand-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand-gold file:px-4 file:py-2 file:font-semibold file:text-brand-ink disabled:opacity-60"
      />
      {busy && <p className="text-xs text-brand-gold">กำลังอัปโหลด…</p>}
      {done && !busy && <p className="text-xs text-brand-green">✓ เปลี่ยนรูปแล้ว</p>}
      {err && <p className="text-xs text-red-300">{err}</p>}
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { STORAGE_BUCKET } from '@/lib/types';
import { createMediaUploadUrl, recordSessionMedia } from '@/app/_actions/media';

/**
 * Uploads a photo or video straight from the browser to Supabase Storage
 * (via a signed URL), then records it. Bypasses the serverless body limit, so
 * large phone photos and video clips work.
 */
export default function MediaUploader({
  dogId,
  lessonId = null,
  lessons,
  withCaption = false,
  label = '📷 อัปโหลดรูป/วิดีโอ',
}: {
  dogId: string;
  lessonId?: number | null;
  lessons?: { id: number; name_th: string }[];
  withCaption?: boolean;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [lesson, setLesson] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const chosenLessonId = lessons
    ? lesson
      ? Number(lesson)
      : null
    : lessonId;

  async function handleFile(file: File) {
    setBusy(true);
    setErr(null);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const signed = await createMediaUploadUrl({ dogId, ext });
      if ('error' in signed) throw new Error(signed.error);

      const supabase = createClient();
      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .uploadToSignedUrl(signed.path, signed.token, file, {
          contentType: file.type || undefined,
        });
      if (upErr) throw upErr;

      const mediaType = file.type.startsWith('video') ? 'video' : 'image';
      const rec = await recordSessionMedia({
        dogId,
        lessonId: chosenLessonId,
        path: signed.path,
        mediaType,
        caption: withCaption ? caption : null,
      });
      if ('error' in rec) throw new Error(rec.error);

      setCaption('');
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    } catch {
      setErr('อัปโหลดไม่สำเร็จ ลองใหม่ (ไฟล์อาจใหญ่เกินไป)');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {lessons && (
        <select
          value={lesson}
          onChange={(e) => setLesson(e.target.value)}
          className="input"
        >
          <option value="">— ไม่ระบุเกม —</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {String(l.id).padStart(2, '0')} · {l.name_th}
            </option>
          ))}
        </select>
      )}
      {withCaption && (
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="คำบรรยาย (ไม่บังคับ) เช่น ครั้งที่ 3"
          className="input"
        />
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
        className="block w-full text-sm text-brand-mutedInk file:mr-3 file:rounded-full file:border-0 file:bg-brand-blue file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white disabled:opacity-60"
      />
      {busy && <p className="text-xs text-brand-blue">กำลังอัปโหลด… อย่าปิดหน้านี้</p>}
      {err && <p className="text-xs text-red-300">{err}</p>}
      {!busy && !err && (
        <p className="text-xs text-brand-mutedInk">{label} · รองรับคลิปวิดีโอด้วย</p>
      )}
    </div>
  );
}

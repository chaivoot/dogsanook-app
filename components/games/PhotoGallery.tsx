import type { Lesson, SessionPhoto } from '@/lib/types';

/** Read-only gallery of training photos ("บันทึกภาพทุกครั้งที่ฝึก"). */
export default function PhotoGallery({
  photos,
  lessons,
}: {
  photos: SessionPhoto[];
  lessons: Lesson[];
}) {
  const lessonName = new Map(lessons.map((l) => [l.id, l.name_th]));

  if (photos.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-white/10 px-4 py-8 text-center text-sm text-brand-muted">
        ยังไม่มีรูปการฝึก · ครูจะอัปโหลดรูปให้ทุกคาบเรียน
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((photo) => (
        <figure
          key={photo.id}
          className="overflow-hidden rounded-2xl border border-white/5 bg-brand-bgSoft"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.photo_url}
            alt={photo.caption ?? 'รูปการฝึก'}
            className="aspect-square w-full object-cover"
          />
          <figcaption className="px-3 py-2 text-xs text-brand-muted">
            {photo.caption ??
              (photo.lesson_id ? lessonName.get(photo.lesson_id) : 'การฝึก')}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

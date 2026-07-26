import type { Lesson, SessionPhoto } from '@/lib/types';
import { deleteOwnerPhoto } from '@/app/dashboard/actions';

/** Read-only gallery of training photos ("บันทึกภาพทุกครั้งที่ฝึก").
 *  If `deletableFor` (a profile id) is given, photos that profile uploaded get
 *  a delete button. */
export default function PhotoGallery({
  photos,
  lessons,
  deletableFor,
}: {
  photos: SessionPhoto[];
  lessons: Lesson[];
  deletableFor?: string;
}) {
  const lessonName = new Map(lessons.map((l) => [l.id, l.name_th]));

  if (photos.length === 0) {
    return (
      <p className="rounded-card border border-dashed border-white/10 px-4 py-8 text-center text-sm text-brand-muted">
        ยังไม่มีรูปการฝึก · ครูจะอัปโหลดรูปให้ และคุณเพิ่มรูปของตัวเองในแต่ละเกมได้
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((photo) => {
        const mine = !!deletableFor && photo.uploaded_by === deletableFor;
        return (
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
            <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-brand-muted">
              <span className="truncate">
                {photo.caption ??
                  (photo.lesson_id ? lessonName.get(photo.lesson_id) : 'การฝึก')}
                {mine && <span className="ml-1 text-brand-blue">· ของคุณ</span>}
              </span>
              {mine && (
                <form action={deleteOwnerPhoto}>
                  <input type="hidden" name="photoId" value={photo.id} />
                  <button
                    type="submit"
                    aria-label="ลบรูป"
                    className="shrink-0 text-red-300 hover:text-red-200"
                  >
                    ลบ
                  </button>
                </form>
              )}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

import Link from 'next/link';
import type { LessonProgressView, SessionPhoto } from '@/lib/types';
import {
  checkinLesson,
  undoCheckin,
  deleteOwnerPhoto,
} from '@/app/dashboard/actions';
import MediaUploader from '@/components/MediaUploader';
import { StatusRow } from './StatusPieces';

function GuideLink({ to }: { to: string | number }) {
  return (
    <Link
      href={`/games/${to}`}
      className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand-teal hover:underline"
    >
      ดูคู่มือเกม →
    </Link>
  );
}

/** Thumbnails of this game's photos/clips, with delete on the owner's own. */
function MediaStrip({
  photos,
  ownerId,
  readOnly,
}: {
  photos: SessionPhoto[];
  ownerId?: string;
  readOnly: boolean;
}) {
  if (photos.length === 0) return null;
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {photos.map((p) => {
        const mine = !readOnly && !!ownerId && p.uploaded_by === ownerId;
        return (
          <figure
            key={p.id}
            className="relative overflow-hidden rounded-xl border border-black/5"
          >
            {p.media_type === 'video' ? (
              <video
                src={p.photo_url}
                controls
                className="aspect-square w-full bg-black object-cover"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={p.photo_url}
                alt={p.caption ?? 'รูปการฝึก'}
                className="aspect-square w-full object-cover"
              />
            )}
            {mine && (
              <form
                action={deleteOwnerPhoto}
                className="absolute right-1 top-1"
              >
                <input type="hidden" name="photoId" value={p.id} />
                <button
                  type="submit"
                  aria-label="ลบ"
                  className="rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white hover:bg-black/80"
                >
                  ลบ
                </button>
              </form>
            )}
          </figure>
        );
      })}
    </div>
  );
}

/** One cream game card for the owner dashboard (taught/can_do read-only).
 *  Photos/clips for this game show right under the card. `readOnly` (staff
 *  preview) hides the check-in and upload controls. */
export default function OwnerGameCard({
  dogId,
  view,
  photos = [],
  ownerId,
  readOnly = false,
}: {
  dogId: string;
  view: LessonProgressView;
  photos?: SessionPhoto[];
  ownerId?: string;
  readOnly?: boolean;
}) {
  const { lesson, taught, can_do, practiced_count, progress } = view;
  const locked = !progress && practiced_count === 0 && photos.length === 0;
  const num = String(lesson.id).padStart(2, '0');

  if (locked) {
    return (
      <div className="game-card opacity-60">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-brand-mutedInk">{num}</span>
          <h3 className="text-lg font-semibold text-brand-mutedInk">
            {lesson.name_th}
          </h3>
        </div>
        <p className="mt-2 text-xs text-brand-mutedInk">ยังไม่ถึง · รอเรียน</p>
        <GuideLink to={lesson.slug ?? lesson.id} />
      </div>
    );
  }

  return (
    <div className="game-card">
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold text-brand-gold">{num}</span>
        <div>
          <h3 className="text-lg font-semibold text-brand-ink">
            {lesson.name_th}
          </h3>
          <GuideLink to={lesson.slug ?? lesson.id} />
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <StatusRow label="สอนแล้ว" active={taught} tone="gold" />
        <StatusRow label="น้องทำได้แล้ว" active={can_do} tone="gold" />

        <div className="flex items-center justify-between gap-2">
          <StatusRow
            label={`เจ้าของฝึกเอง · ${practiced_count} ครั้ง`}
            active={practiced_count > 0}
            tone="blue"
          />
          {!readOnly && (
            <div className="flex items-center gap-1.5">
              {practiced_count > 0 && (
                <form action={undoCheckin}>
                  <input type="hidden" name="dogId" value={dogId} />
                  <input type="hidden" name="lessonId" value={lesson.id} />
                  <button
                    type="submit"
                    aria-label="ลบเช็คอินล่าสุด"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-brand-mutedInk transition hover:bg-black/5"
                  >
                    −
                  </button>
                </form>
              )}
              <form action={checkinLesson}>
                <input type="hidden" name="dogId" value={dogId} />
                <input type="hidden" name="lessonId" value={lesson.id} />
                <button
                  type="submit"
                  className="flex h-8 items-center gap-1 rounded-full bg-brand-blue px-3 text-sm font-semibold text-white transition hover:bg-brand-blueDark"
                >
                  + เช็คอิน
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* This game's photos/clips */}
      <MediaStrip photos={photos} ownerId={ownerId} readOnly={readOnly} />

      {!readOnly && (
        <details className="mt-3 border-t border-black/10 pt-3">
          <summary className="cursor-pointer text-sm font-medium text-brand-blue">
            📷 เพิ่มรูป/วิดีโอการฝึกของฉัน
          </summary>
          <div className="mt-2">
            <MediaUploader dogId={dogId} lessonId={lesson.id} />
          </div>
        </details>
      )}
    </div>
  );
}

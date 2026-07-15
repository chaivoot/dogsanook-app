import Link from 'next/link';
import type { LessonProgressView } from '@/lib/types';
import { checkinLesson, undoCheckin } from '@/app/dashboard/actions';
import { StatusRow } from './StatusPieces';

function GuideLink({ slug }: { slug: string | null }) {
  if (!slug) return null;
  return (
    <Link
      href={`/games/${slug}`}
      className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand-teal hover:underline"
    >
      ดูคู่มือเกม →
    </Link>
  );
}

/** One cream game card for the owner dashboard (taught/can_do read-only).
 *  `readOnly` renders the exact same layout but without the check-in buttons —
 *  used for the staff "owner preview". */
export default function OwnerGameCard({
  dogId,
  view,
  readOnly = false,
}: {
  dogId: string;
  view: LessonProgressView;
  readOnly?: boolean;
}) {
  const { lesson, taught, can_do, practiced_count, progress } = view;
  const locked = !progress && practiced_count === 0;
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
        <GuideLink slug={lesson.slug} />
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
          <GuideLink slug={lesson.slug} />
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
    </div>
  );
}

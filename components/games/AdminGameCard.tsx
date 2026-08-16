import Link from 'next/link';
import type { LessonProgressView } from '@/lib/types';
import { toggleTaught, toggleCanDo } from '@/app/admin/actions';

/** Cream game card for the admin panel — toggles taught / can_do. */
export default function AdminGameCard({
  dogId,
  view,
}: {
  dogId: string;
  view: LessonProgressView;
}) {
  const { lesson, taught, can_do, practiced_count } = view;
  const num = String(lesson.id).padStart(2, '0');

  return (
    <div className="game-card">
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold text-brand-gold">{num}</span>
        <div>
          <h3 className="text-lg font-semibold text-brand-ink">
            {lesson.name_th}
          </h3>
          <Link
            href={`/games/${lesson.slug ?? lesson.id}`}
            className="text-sm font-medium text-brand-teal hover:underline"
          >
            ดูคู่มือ →
          </Link>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <ToggleButton
          action={toggleTaught}
          dogId={dogId}
          lessonId={lesson.id}
          active={taught}
          label="สอนแล้ว"
        />
        <ToggleButton
          action={toggleCanDo}
          dogId={dogId}
          lessonId={lesson.id}
          active={can_do}
          label="น้องทำได้แล้ว"
        />
        <span className="inline-flex items-center rounded-full bg-brand-blue/10 px-3 py-1.5 text-sm text-brand-blue">
          เจ้าของฝึกเอง · {practiced_count} ครั้ง
        </span>
      </div>
    </div>
  );
}

function ToggleButton({
  action,
  dogId,
  lessonId,
  active,
  label,
}: {
  action: (formData: FormData) => void;
  dogId: string;
  lessonId: number;
  active: boolean;
  label: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="dogId" value={dogId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="value" value={(!active).toString()} />
      <button
        type="submit"
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
          active
            ? 'bg-brand-gold text-brand-ink'
            : 'border border-black/15 text-brand-mutedInk hover:bg-black/5'
        }`}
      >
        <span className="text-xs">{active ? '✓' : '○'}</span>
        {label}
      </button>
    </form>
  );
}

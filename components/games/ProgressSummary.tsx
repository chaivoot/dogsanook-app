import type { LessonProgressView } from '@/lib/types';

/** The "x / 10" headline + golden progress bar from the /mommam page. */
export default function ProgressSummary({
  lessons,
}: {
  lessons: LessonProgressView[];
}) {
  const total = lessons.length;
  const done = lessons.filter((l) => l.can_do).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="dark-card">
      <div className="flex items-end justify-between">
        <span className="text-sm font-medium text-brand-muted">
          ความคืบหน้าภาพรวม
        </span>
        <span className="text-lg font-bold text-brand-gold">
          {done} <span className="text-brand-muted">/ {total}</span>
        </span>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-brand-bg">
        <div
          className="h-full rounded-full bg-brand-gold transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-brand-muted">
        เกมที่น้องทำได้แล้ว {done} จาก {total} เกม
      </p>
    </div>
  );
}

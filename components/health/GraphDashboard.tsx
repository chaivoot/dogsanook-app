import type { Dog, Vaccination, WeightLog } from '@/lib/types';
import WeightChart from './WeightChart';

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

/**
 * The change-tracking section on the "น้องหมา" tab: weight history over time.
 * DER / measurements / vaccines already live in the passport above, so we only
 * add what it doesn't have — the trend — to avoid duplicating everything.
 */
export default function GraphDashboard({
  dog,
  weightLogs,
}: {
  dog: Dog;
  weightLogs: WeightLog[];
  vaccinations?: Vaccination[];
}) {
  const first = weightLogs[0];
  const latest = weightLogs[weightLogs.length - 1];
  const change =
    weightLogs.length >= 2 && first && latest
      ? Number(latest.weight_kg) - Number(first.weight_kg)
      : null;

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-brand-gold">บันทึกน้ำหนัก</h2>

      <section className="rounded-card border border-white/5 bg-brand-bgSoft p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs text-brand-muted">น้ำหนักล่าสุด</div>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-brand-gold">
                {dog.weight_kg ?? '–'}
              </span>
              <span className="text-sm text-brand-muted">กก.</span>
            </div>
          </div>
          {change != null && change !== 0 && (
            <span
              className={`rounded-full px-3 py-1 text-xs ${
                change > 0
                  ? 'bg-brand-green/15 text-brand-green'
                  : 'bg-brand-blue/15 text-brand-blue'
              }`}
            >
              {change > 0 ? '+' : ''}
              {change.toFixed(1)} กก. จากครั้งแรก
            </span>
          )}
        </div>
        <div className="mt-3">
          <WeightChart logs={weightLogs} dogId={dog.id} />
        </div>
      </section>

      {weightLogs.length > 0 && (
        <p className="text-center text-xs text-brand-muted">
          ชั่งน้ำหนักแล้ว {weightLogs.length} ครั้ง
          {first ? ` · เริ่มบันทึก ${fmtDate(first.measured_at)}` : ''}
        </p>
      )}
    </div>
  );
}

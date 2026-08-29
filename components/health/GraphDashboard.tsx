import type { Dog, Vaccination, WeightLog } from '@/lib/types';
import { dailyEnergy } from '@/lib/der';
import DerRing from './DerRing';
import WeightChart from './WeightChart';

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

/** The "กราฟ" tab — weight trend, DER, measurements, vaccine timeline. */
export default function GraphDashboard({
  dog,
  weightLogs,
  vaccinations,
}: {
  dog: Dog;
  weightLogs: WeightLog[];
  vaccinations: Vaccination[];
}) {
  const der = dailyEnergy(dog.weight_kg, {
    activity: dog.activity_level,
    neutered: dog.neutered,
  });

  const first = weightLogs[0];
  const latest = weightLogs[weightLogs.length - 1];
  const change =
    first && latest ? Number(latest.weight_kg) - Number(first.weight_kg) : null;

  const noMeasures =
    dog.chest_cm == null && dog.neck_cm == null && dog.muzzle_cm == null;
  const SAMPLE_BARS = [
    { label: 'รอบอก', value: 58 },
    { label: 'รอบคอ', value: 32 },
    { label: 'รอบปาก', value: 24 },
  ];
  const realBars: { label: string; value: number | null }[] = [
    { label: 'รอบอก', value: dog.chest_cm },
    { label: 'รอบคอ', value: dog.neck_cm },
    { label: 'รอบปาก', value: dog.muzzle_cm },
  ];
  const shownBars = noMeasures ? SAMPLE_BARS : realBars;
  const shownMax = Math.max(...shownBars.map((b) => b.value ?? 0), 1);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-brand-cream">พัฒนาการ{dog.name}</h1>

      {/* weight trend */}
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
          {change != null && (
            <span
              className={`rounded-full px-3 py-1 text-xs ${
                change === 0
                  ? 'bg-white/5 text-brand-muted'
                  : change > 0
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

      {/* DER + change */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center rounded-card border border-white/5 bg-brand-bgSoft p-4 text-center">
          {der != null ? (
            <DerRing der={der} />
          ) : (
            <div className="relative">
              <div className="opacity-40">
                <DerRing der={480} />
              </div>
              <span className="absolute inset-x-0 -bottom-1 mx-auto w-fit rounded-full bg-brand-bg/80 px-2 py-0.5 text-[10px] text-brand-muted">
                ตัวอย่าง
              </span>
            </div>
          )}
          <div className="mt-2 text-sm font-semibold text-brand-cream">พลังงาน (DER)</div>
          <div className="mt-0.5 text-[11px] text-brand-muted">
            {der != null ? 'จากน้ำหนัก + กิจกรรม' : 'ใส่น้ำหนักเพื่อคำนวณ'}
          </div>
        </div>
        <div className="rounded-card border border-white/5 bg-brand-bgSoft p-4">
          <div className="text-xs text-brand-muted">บันทึกน้ำหนัก</div>
          <div className="mt-1 text-2xl font-bold text-brand-cream">
            {weightLogs.length}
            <span className="ml-1 text-xs font-medium text-brand-muted">ครั้ง</span>
          </div>
          {first && (
            <div className="mt-3 text-[11px] leading-relaxed text-brand-muted">
              เริ่มบันทึก {fmtDate(first.measured_at)}
              <br />
              {first.weight_kg} กก. → {latest?.weight_kg} กก.
            </div>
          )}
        </div>
      </div>

      {/* measurements as bars */}
      <section className="rounded-card border border-white/5 bg-brand-bgSoft p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-brand-cream">ขนาดตัว (ซม.)</span>
          {noMeasures && (
            <span className="rounded-full bg-brand-bg/80 px-2 py-0.5 text-[10px] text-brand-muted">
              ตัวอย่าง
            </span>
          )}
        </div>
        <div className={`space-y-3 ${noMeasures ? 'opacity-40' : ''}`}>
          {shownBars.map((b) => (
            <div key={b.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-brand-cream">{b.label}</span>
                <span className="text-brand-muted">{b.value ?? '–'} cm</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#3a2f27]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${((b.value ?? 0) / shownMax) * 100}%`,
                    background: 'linear-gradient(90deg,#00848e,#4fd1c5)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        {noMeasures && (
          <p className="mt-3 text-center text-xs text-brand-cream">
            บันทึกรอบอก/คอ/ปากในหน้า “สุขภาพ” เพื่อดูค่าจริง
          </p>
        )}
      </section>

      {/* vaccine timeline */}
      <section className="rounded-card border border-white/5 bg-brand-bgSoft p-4">
        <div className="mb-3 text-sm font-medium text-brand-cream">ไทม์ไลน์วัคซีน</div>
        {vaccinations.length === 0 ? (
          <p className="text-xs text-brand-muted">ยังไม่มีประวัติวัคซีน</p>
        ) : (
          <ol className="space-y-0">
            {vaccinations.map((v, i) => (
              <li key={v.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-full bg-brand-green ring-4 ring-brand-green/15" />
                  {i < vaccinations.length - 1 && (
                    <span className="my-1 w-0.5 flex-1 bg-[#3a2f27]" />
                  )}
                </div>
                <div className="pb-4">
                  <div className="text-[13px] font-medium text-brand-cream">{v.name}</div>
                  <div className="text-xs text-brand-muted">
                    {fmtDate(v.given_on)}
                    {v.clinic ? ` · ${v.clinic}` : ''}
                    {v.next_due_on ? ` · เข็มถัดไป ${fmtDate(v.next_due_on)}` : ''}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

import Link from 'next/link';
import type { WeightLog } from '@/lib/types';

// A gentle up-trending sample so the graph always looks alive — the visual
// is the selling point, so customers see it first, then get nudged to fill in
// their own data.
const SAMPLE: number[] = [11.6, 11.8, 11.7, 12.0, 12.2, 12.4, 12.5];

/** Full-size weight area chart with gridlines and date labels. */
export default function WeightChart({
  logs,
  dogId,
}: {
  logs: WeightLog[];
  dogId?: string;
}) {
  const isSample = logs.length === 0;
  const weights = isSample ? SAMPLE : logs.map((l) => Number(l.weight_kg));

  const W = 330;
  const H = 150;
  const padX = 6;
  const padTop = 14;
  const padBottom = 22;

  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const span = max - min || 1;
  const n = weights.length;

  const x = (i: number) => (n === 1 ? W / 2 : padX + (i / (n - 1)) * (W - padX * 2));
  const y = (w: number) => padTop + (1 - (w - min) / span) * (H - padTop - padBottom);

  const pts = weights.map((w, i) => [x(i), y(w)] as const);
  const line = pts.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' L');
  const area = `M${line} L${pts[n - 1][0].toFixed(1)},${H - padBottom} L${pts[0][0].toFixed(
    1,
  )},${H - padBottom} Z`;
  const last = pts[n - 1];
  const grid = [0.25, 0.5, 0.75].map((f) => padTop + f * (H - padTop - padBottom));

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('th-TH', { month: 'short' });
  const step = Math.max(1, Math.ceil(n / 5));

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={`block w-full ${isSample ? 'opacity-40' : ''}`}
        role="img"
        aria-label="กราฟน้ำหนัก"
      >
        <defs>
          <linearGradient id="wcfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#00848e" stopOpacity="0.45" />
            <stop offset="1" stopColor="#00848e" stopOpacity="0" />
          </linearGradient>
        </defs>
        {grid.map((gy, i) => (
          <line key={i} x1="0" y1={gy} x2={W} y2={gy} stroke="#3a2f27" strokeWidth="1" strokeDasharray="3 5" />
        ))}
        {n > 1 && <path d={area} fill="url(#wcfill)" />}
        {n > 1 && (
          <path
            d={`M${line}`}
            fill="none"
            stroke="#00848e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {pts.map(([px, py], i) => (
          <circle
            key={i}
            cx={px}
            cy={py}
            r={i === n - 1 ? 5 : 3}
            fill={i === n - 1 ? '#ffcb05' : '#00848e'}
            stroke="#221b16"
            strokeWidth={i === n - 1 ? 2.5 : 0}
          />
        ))}
        {!isSample &&
          logs.map((l, i) =>
            i % step === 0 || i === n - 1 ? (
              <text key={l.id} x={x(i)} y={H - 6} textAnchor="middle" fill="#8a7f74" fontSize="10">
                {fmt(l.measured_at)}
              </text>
            ) : null,
          )}
      </svg>

      {isSample ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
          <span className="rounded-full bg-brand-bg/80 px-2.5 py-0.5 text-[10px] text-brand-muted">
            ตัวอย่าง
          </span>
          <p className="max-w-[220px] text-xs text-brand-cream">
            บันทึกน้ำหนักของน้อง แล้วกราฟจริงจะขึ้นตรงนี้
          </p>
          {dogId && (
            <Link
              href={`/dashboard?tab=health&dog=${dogId}`}
              className="rounded-full bg-brand-gold px-4 py-1.5 text-xs font-semibold text-brand-ink"
            >
              + บันทึกน้ำหนัก
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-1 flex justify-between text-[11px] text-brand-muted">
          <span>ต่ำสุด {min} กก.</span>
          <span>สูงสุด {max} กก.</span>
        </div>
      )}
    </div>
  );
}

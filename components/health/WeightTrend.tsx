import type { WeightLog } from '@/lib/types';

/** Area/line sparkline of weight over time. Pure inline SVG, no client JS. */
export default function WeightTrend({ logs }: { logs: WeightLog[] }) {
  if (logs.length < 2) return null;

  const W = 320;
  const H = 96;
  const pad = 6;
  const weights = logs.map((l) => Number(l.weight_kg));
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const span = max - min || 1;

  const pts = logs.map((l, i) => {
    const x = pad + (i / (logs.length - 1)) * (W - pad * 2);
    const y = pad + (1 - (Number(l.weight_kg) - min) / span) * (H - pad * 2);
    return [x, y] as const;
  });

  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L');
  const area = `M${line} L${pts[pts.length - 1][0].toFixed(1)},${H} L${pts[0][0].toFixed(
    1,
  )},${H} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="mt-3 block h-24 w-full"
      role="img"
      aria-label="กราฟน้ำหนัก"
    >
      <defs>
        <linearGradient id="wtfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#00848e" stopOpacity="0.4" />
          <stop offset="1" stopColor="#00848e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#wtfill)" />
      <path
        d={`M${line}`}
        fill="none"
        stroke="#00848e"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r="4" fill="#ffcb05" stroke="#221b16" strokeWidth="2" />
    </svg>
  );
}

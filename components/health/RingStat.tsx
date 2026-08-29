/**
 * A labelled circular gauge on a cream card — the RER / DER / BCS / weight
 * rings from the nutrition dashboard. `fraction` (0–1) fills the arc.
 */
export default function RingStat({
  title,
  subtitle,
  center,
  unit,
  footer,
  fraction,
  color,
}: {
  title: string;
  subtitle?: string;
  center: string;
  unit?: string;
  footer?: string;
  fraction: number;
  color: string;
}) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, fraction));
  const offset = circ * (1 - f);

  return (
    <div className="flex flex-col items-center rounded-card bg-brand-card p-4 text-center text-brand-ink">
      <div className="text-sm font-bold">{title}</div>
      {subtitle && <div className="text-[11px] text-brand-mutedInk">{subtitle}</div>}

      <svg viewBox="0 0 100 100" className="my-2 h-24 w-24">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e7ddc9" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
        <text
          x="50"
          y={unit ? '47' : '54'}
          textAnchor="middle"
          fill="#2a2018"
          fontSize="22"
          fontWeight="700"
        >
          {center}
        </text>
        {unit && (
          <text x="50" y="62" textAnchor="middle" fill="#8a7f74" fontSize="10">
            {unit}
          </text>
        )}
      </svg>

      {footer && <div className="text-[11px] text-brand-mutedInk">{footer}</div>}
    </div>
  );
}

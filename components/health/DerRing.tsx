/** Circular DER gauge. RER..DER maps roughly onto the arc for a sense of scale. */
export default function DerRing({ der }: { der: number }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  // Fill the arc proportionally within a 0–1500 kcal visual scale (capped).
  const frac = Math.max(0.08, Math.min(1, der / 1500));
  const offset = circ * (1 - frac);

  return (
    <svg viewBox="0 0 80 80" className="h-[76px] w-[76px] shrink-0" role="img" aria-label="DER">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#3a2f27" strokeWidth="8" />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke="#00848e"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 40 40)"
      />
      <text
        x="40"
        y="37"
        textAnchor="middle"
        fill="#f5efe6"
        fontSize="16"
        fontWeight="700"
      >
        {der}
      </text>
      <text x="40" y="52" textAnchor="middle" fill="#9c9088" fontSize="9">
        kcal/วัน
      </text>
    </svg>
  );
}

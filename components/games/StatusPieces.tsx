type Tone = 'gold' | 'blue' | 'muted';

const toneClasses: Record<Tone, string> = {
  gold: 'bg-brand-gold text-brand-ink',
  blue: 'bg-brand-blue text-white',
  muted: 'bg-black/10 text-brand-mutedInk',
};

/** Small filled/hollow check dot used in the legend and status rows. */
export function CheckDot({
  tone = 'gold',
  filled = true,
}: {
  tone?: Tone;
  filled?: boolean;
}) {
  if (!filled) {
    return (
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-[5px] border border-current/40" />
    );
  }
  return (
    <span
      className={`inline-flex h-4 w-4 items-center justify-center rounded-[5px] ${toneClasses[tone]}`}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 13l4 4L19 7"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** A labelled status row inside a game card (owner, read-only). */
export function StatusRow({
  label,
  active,
  tone = 'gold',
}: {
  label: string;
  active: boolean;
  tone?: Tone;
}) {
  return (
    <div
      className={`flex items-center gap-2 text-sm ${
        active ? 'text-brand-ink' : 'text-brand-mutedInk'
      }`}
    >
      <CheckDot tone={active ? tone : 'muted'} filled={active} />
      <span className={active ? 'font-medium' : ''}>{label}</span>
    </div>
  );
}

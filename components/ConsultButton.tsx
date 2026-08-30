/** tel: consult CTA. Set NEXT_PUBLIC_CONSULT_PHONE to override the number. */
export default function ConsultButton({ label }: { label: string }) {
  const phone = process.env.NEXT_PUBLIC_CONSULT_PHONE?.trim() || '0819496389';
  if (!phone) return null;
  const tel = phone.replace(/[^+\d]/g, '');
  return (
    <a
      href={`tel:${tel}`}
      className="flex items-center justify-center gap-2 rounded-card border border-brand-gold/50 px-6 py-3 font-semibold text-brand-gold transition hover:bg-brand-gold/10"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
      {label}
    </a>
  );
}

import Link from 'next/link';

type Tab = 'info' | 'nutrition' | 'training' | 'manage';

const ICONS: Record<Tab, React.ReactNode> = {
  info: (
    // health book / passport
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </>
  ),
  nutrition: (
    // food drop
    <>
      <path d="M12 2s4 3 4 8a4 4 0 0 1-8 0c0-5 4-8 4-8z" />
      <path d="M8 14v6M16 14v6" />
    </>
  ),
  training: (
    // target
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.5" />
    </>
  ),
  manage: (
    // multiple owners
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
};

const LABELS: Record<Tab, string> = {
  info: 'น้องหมา',
  nutrition: 'โภชนาการ',
  training: 'การฝึก',
  manage: 'จัดการ',
};

const ORDER: Tab[] = ['info', 'nutrition', 'training', 'manage'];

/** Fixed mobile bottom nav, matching the mockup. Preserves the active dog. */
export default function BottomNav({
  active,
  dogId,
}: {
  active: Tab;
  dogId?: string | null;
}) {
  const q = (tab: Tab) =>
    dogId ? `/dashboard?tab=${tab}&dog=${dogId}` : `/dashboard?tab=${tab}`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-white/5 bg-brand-bg/95 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1 px-3 py-2">
        {ORDER.map((tab) => {
          const on = tab === active;
          return (
            <Link
              key={tab}
              href={q(tab)}
              className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] transition ${
                on ? 'text-brand-gold' : 'text-brand-muted hover:text-brand-cream'
              }`}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {ICONS[tab]}
              </svg>
              {LABELS[tab]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

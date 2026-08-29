import Link from 'next/link';

type Tab = 'health' | 'graph' | 'services' | 'dogs';

const ICONS: Record<Tab, React.ReactNode> = {
  health: (
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  ),
  graph: (
    <>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </>
  ),
  services: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  dogs: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
    </>
  ),
};

const LABELS: Record<Tab, string> = {
  health: 'สุขภาพ',
  graph: 'กราฟ',
  services: 'บริการ',
  dogs: 'น้อง',
};

const ORDER: Tab[] = ['health', 'graph', 'services', 'dogs'];

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

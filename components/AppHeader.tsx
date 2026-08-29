import Link from 'next/link';
import Logo from '@/components/Logo';
import SignOutButton from '@/components/SignOutButton';
import type { Profile } from '@/lib/types';
import { isStaff } from '@/lib/auth';

export default function AppHeader({ profile }: { profile: Profile }) {
  return (
    <header className="sticky top-0 z-10 border-b border-white/5 bg-brand-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-5 py-3">
        <Link href="/dashboard">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          {isStaff(profile) && (
            <Link
              href="/admin"
              className="rounded-full bg-brand-green/20 px-3 py-1 text-xs font-medium text-brand-green hover:bg-brand-green/30"
            >
              แผงครู
            </Link>
          )}
          <span className="hidden text-sm text-brand-muted sm:inline">
            {profile.display_name}
          </span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

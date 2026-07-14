import Link from 'next/link';
import Logo from '@/components/Logo';
import SignOutButton from '@/components/SignOutButton';
import type { Profile } from '@/lib/types';
import { isStaff } from '@/lib/auth';

export default function AppHeader({ profile }: { profile: Profile }) {
  return (
    <header className="sticky top-0 z-10 border-b border-white/5 bg-brand-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3">
        <Link href={isStaff(profile) ? '/admin' : '/dashboard'}>
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-brand-muted sm:inline">
            {profile.display_name}
            {isStaff(profile) && (
              <span className="ml-1 rounded-full bg-brand-green/20 px-2 py-0.5 text-xs text-brand-green">
                ครู
              </span>
            )}
          </span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

/** Returns the signed-in user's profile, or null when not authenticated. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (data as Profile) ?? null;
}

/**
 * Guard for pages that require an approved account. The middleware already
 * enforces this, but calling it in the page keeps types tight and protects
 * against direct data-layer access.
 */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/');
  if (profile.status === 'pending') redirect('/pending');
  if (profile.status === 'blocked') redirect('/blocked');
  return profile;
}

export function isStaff(profile: Profile | null): boolean {
  return profile?.role === 'admin' || profile?.role === 'teacher';
}

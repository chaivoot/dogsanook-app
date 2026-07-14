import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session';
import type { Profile } from '@/lib/types';

/** Returns the signed-in user's profile from our session cookie, or null. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);
  if (!payload?.pid) return null;

  const admin = createServiceClient();
  const { data } = await admin
    .from('profiles')
    .select('*')
    .eq('id', payload.pid)
    .single();

  return (data as Profile) ?? null;
}

/** Guard for pages that require an approved account. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/');
  if (profile.status === 'pending') redirect('/pending');
  if (profile.status === 'blocked') redirect('/blocked');
  return profile;
}

/** Guard for staff-only (admin/teacher) pages. */
export async function requireStaff(): Promise<Profile> {
  const profile = await requireProfile();
  if (!isStaff(profile)) redirect('/dashboard');
  return profile;
}

export function isStaff(profile: Profile | null): boolean {
  return profile?.role === 'admin' || profile?.role === 'teacher';
}

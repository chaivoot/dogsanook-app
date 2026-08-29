import { createServiceClient } from '@/lib/supabase/service';
import type {
  Dog,
  DogInvite,
  DogLessonProgress,
  DogWithOwners,
  Lesson,
  LessonProgressView,
  Profile,
  SessionPhoto,
  Vaccination,
  VoucherCampaign,
  VoucherClaim,
  WeightLog,
} from '@/lib/types';

const DOG_WITH_OWNERS = '*, dog_owners(owner:profiles(id, display_name))';

/** All profiles, pending first (admin user management). */
export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  const profiles = (data as Profile[]) ?? [];
  const rank = { pending: 0, allowed: 1, blocked: 2 } as const;
  return profiles.sort((a, b) => rank[a.status] - rank[b.status]);
}

export async function getLessons(): Promise<Lesson[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('lessons')
    .select('*')
    .order('sort_order', { ascending: true });
  return (data as Lesson[]) ?? [];
}

/** Look up a lesson by slug, or by numeric id (fallback when slug is missing). */
export async function getLessonBySlug(slug: string): Promise<Lesson | null> {
  const supabase = createServiceClient();
  const column = /^\d+$/.test(slug) ? 'id' : 'slug';
  const value = column === 'id' ? Number(slug) : slug;
  const { data } = await supabase
    .from('lessons')
    .select('*')
    .eq(column, value)
    .maybeSingle();
  return (data as Lesson) ?? null;
}

export async function getDogById(dogId: string): Promise<DogWithOwners | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('dogs')
    .select(DOG_WITH_OWNERS)
    .eq('id', dogId)
    .maybeSingle();
  return (data as DogWithOwners) ?? null;
}

/** Weight history for the trend graph, oldest → newest. */
export async function getWeightLogs(dogId: string): Promise<WeightLog[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('dog_id', dogId)
    .order('measured_at', { ascending: true });
  return (data as WeightLog[]) ?? [];
}

/** Across all dogs: the latest dose per (dog, vaccine) that is due within
 *  `withinDays` days (overdue included), soonest first — for the admin overview. */
export async function getUpcomingVaccinations(
  withinDays = 31,
): Promise<
  { dogId: string; dogName: string; name: string; nextDueOn: string; days: number }[]
> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('vaccinations')
    .select('dog_id, name, given_on, next_due_on, dog:dogs(name)')
    .not('next_due_on', 'is', null);

  const rows =
    (data as unknown as {
      dog_id: string;
      name: string;
      given_on: string | null;
      next_due_on: string;
      dog: { name: string | null } | null;
    }[]) ?? [];

  // keep only the latest dose per (dog, vaccine name)
  const latest = new Map<string, (typeof rows)[number]>();
  for (const r of rows) {
    const key = `${r.dog_id}|${r.name.trim()}`;
    const cur = latest.get(key);
    const a = r.given_on ? Date.parse(r.given_on) : -Infinity;
    const b = cur?.given_on ? Date.parse(cur.given_on) : -Infinity;
    if (!cur || a > b) latest.set(key, r);
  }

  const now = new Date();
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const out: {
    dogId: string;
    dogName: string;
    name: string;
    nextDueOn: string;
    days: number;
  }[] = [];
  for (const r of latest.values()) {
    const due = new Date(r.next_due_on);
    if (Number.isNaN(due.getTime())) continue;
    const a = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
    const days = Math.round((a - b) / 86400000);
    if (days < withinDays)
      out.push({
        dogId: r.dog_id,
        dogName: r.dog?.name ?? 'ไม่ระบุ',
        name: r.name,
        nextDueOn: r.next_due_on,
        days,
      });
  }
  out.sort((x, y) => x.days - y.days);
  return out;
}

/** Vaccination records for the timeline, most recent first. */
export async function getVaccinations(dogId: string): Promise<Vaccination[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('vaccinations')
    .select('*')
    .eq('dog_id', dogId)
    .order('given_on', { ascending: false, nullsFirst: false });
  return (data as Vaccination[]) ?? [];
}

/** Active (not revoked) invites for a dog, newest first. */
export async function getDogInvites(dogId: string): Promise<DogInvite[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('dog_invites')
    .select('*')
    .eq('dog_id', dogId)
    .eq('revoked', false)
    .order('created_at', { ascending: false });
  return (data as DogInvite[]) ?? [];
}

/** An invite token together with its dog (for the accept page). */
export async function getInviteWithDog(
  token: string,
): Promise<{ invite: DogInvite; dog: Dog } | null> {
  const supabase = createServiceClient();
  const { data: invite } = await supabase
    .from('dog_invites')
    .select('*')
    .eq('token', token)
    .maybeSingle();
  if (!invite) return null;
  const { data: dog } = await supabase
    .from('dogs')
    .select('*')
    .eq('id', (invite as DogInvite).dog_id)
    .maybeSingle();
  if (!dog) return null;
  return { invite: invite as DogInvite, dog: dog as Dog };
}

/** Dogs a given profile owns or co-owns (owner dashboard). */
export async function getDogsForOwner(ownerId: string): Promise<Dog[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('dog_owners')
    .select('dog:dogs(*)')
    .eq('owner_id', ownerId);
  const dogs = ((data as unknown as { dog: Dog | null }[]) ?? [])
    .map((r) => r.dog)
    .filter((d): d is Dog => !!d);
  dogs.sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  return dogs;
}

/** All dogs with all of their owners (admin panel). */
export async function getAllDogs(): Promise<DogWithOwners[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('dogs')
    .select(DOG_WITH_OWNERS)
    .order('created_at', { ascending: true });
  return (data as DogWithOwners[]) ?? [];
}

/**
 * Builds the 10-game view model for one dog: taught / can_do flags plus the
 * owner's practice check-in count per lesson, and the training photo gallery.
 */
export async function getDogProgress(dogId: string): Promise<{
  lessons: LessonProgressView[];
  photos: SessionPhoto[];
}> {
  const supabase = createServiceClient();

  const [lessonsRes, progressRes, checkinsRes, photosRes] = await Promise.all([
    supabase.from('lessons').select('*').order('sort_order', { ascending: true }),
    supabase.from('dog_lesson_progress').select('*').eq('dog_id', dogId),
    supabase.from('practice_checkins').select('lesson_id').eq('dog_id', dogId),
    supabase
      .from('session_photos')
      .select('*')
      .eq('dog_id', dogId)
      .order('created_at', { ascending: false }),
  ]);

  const lessons = (lessonsRes.data as Lesson[]) ?? [];
  const progress = (progressRes.data as DogLessonProgress[]) ?? [];
  const checkins = (checkinsRes.data as { lesson_id: number }[]) ?? [];

  const progressByLesson = new Map(progress.map((p) => [p.lesson_id, p]));
  const countByLesson = new Map<number, number>();
  for (const c of checkins) {
    countByLesson.set(c.lesson_id, (countByLesson.get(c.lesson_id) ?? 0) + 1);
  }

  const views: LessonProgressView[] = lessons.map((lesson) => {
    const p = progressByLesson.get(lesson.id);
    return {
      lesson,
      taught: p?.taught ?? false,
      can_do: p?.can_do ?? false,
      practiced_count: countByLesson.get(lesson.id) ?? 0,
      progress: p,
    };
  });

  return { lessons: views, photos: (photosRes.data as SessionPhoto[]) ?? [] };
}

// --- Vouchers ---------------------------------------------------------------

export async function getCampaignBySlug(
  slug: string,
): Promise<VoucherCampaign | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('voucher_campaigns')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return (data as VoucherCampaign) ?? null;
}

/** All campaigns with their claim counts (admin). */
export async function getCampaignsWithCounts(): Promise<
  (VoucherCampaign & { claim_count: number })[]
> {
  const supabase = createServiceClient();
  const [campaignsRes, claimsRes] = await Promise.all([
    supabase
      .from('voucher_campaigns')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('voucher_claims').select('campaign_id'),
  ]);
  const campaigns = (campaignsRes.data as VoucherCampaign[]) ?? [];
  const claims = (claimsRes.data as { campaign_id: string }[]) ?? [];
  const counts = new Map<string, number>();
  for (const c of claims) {
    counts.set(c.campaign_id, (counts.get(c.campaign_id) ?? 0) + 1);
  }
  return campaigns.map((c) => ({ ...c, claim_count: counts.get(c.id) ?? 0 }));
}

export async function countClaims(campaignId: string): Promise<number> {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from('voucher_claims')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId);
  return count ?? 0;
}

/** The current user's claim for a campaign, if any. */
export async function getMyClaim(
  campaignId: string,
  profileId: string,
): Promise<VoucherClaim | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('voucher_claims')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('profile_id', profileId)
    .maybeSingle();
  return (data as VoucherClaim) ?? null;
}

/** All claims with claimer + dog + campaign info (admin). */
type ClaimWithRefs = VoucherClaim & {
  profile: { display_name: string | null } | null;
  dog: { name: string; breed: string | null } | null;
  campaign: { name: string } | null;
};

export async function getClaims(): Promise<ClaimWithRefs[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('voucher_claims')
    .select(
      '*, profile:profiles(display_name), dog:dogs(name, breed), campaign:voucher_campaigns(name)',
    )
    .order('created_at', { ascending: false });
  return (data as unknown as ClaimWithRefs[]) ?? [];
}

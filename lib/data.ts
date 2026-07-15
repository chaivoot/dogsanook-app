import { createServiceClient } from '@/lib/supabase/service';
import type {
  Dog,
  DogLessonProgress,
  Lesson,
  LessonProgressView,
  Profile,
  SessionPhoto,
} from '@/lib/types';

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

export async function getLessonBySlug(slug: string): Promise<Lesson | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('lessons')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return (data as Lesson) ?? null;
}

export async function getDogById(
  dogId: string,
): Promise<(Dog & { owner: { display_name: string | null } | null }) | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('dogs')
    .select('*, owner:profiles!dogs_owner_id_fkey(display_name)')
    .eq('id', dogId)
    .maybeSingle();
  return (data as Dog & { owner: { display_name: string | null } | null }) ?? null;
}

/** Dogs owned by a given profile (owner dashboard). */
export async function getDogsForOwner(ownerId: string): Promise<Dog[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('dogs')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true });
  return (data as Dog[]) ?? [];
}

/** All dogs with their owner's display name (admin panel). */
export async function getAllDogs(): Promise<
  (Dog & { owner: { display_name: string | null } | null })[]
> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('dogs')
    .select('*, owner:profiles!dogs_owner_id_fkey(display_name)')
    .order('created_at', { ascending: true });
  return (data as (Dog & {
    owner: { display_name: string | null } | null;
  })[]) ?? [];
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

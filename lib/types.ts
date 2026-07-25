// Shared domain types mirroring the Postgres schema (schema: public).

export type Role = 'admin' | 'teacher' | 'owner';
export type UserStatus = 'pending' | 'allowed' | 'blocked';

export interface Profile {
  id: string;
  line_user_id: string | null;
  display_name: string | null;
  role: Role;
  status: UserStatus;
  created_at: string;
}

export interface Dog {
  id: string;
  name: string;
  breed: string | null;
  photo_url: string | null;
  owner_id: string | null;
  notes: string | null;
  created_at: string;
}

/** A dog together with all of its owners (a household can share a dog). */
export type DogWithOwners = Dog & {
  dog_owners: { owner: { id: string; display_name: string | null } | null }[];
};

/** Flatten a DogWithOwners into a plain list of owner profiles. */
export function dogOwners(
  dog: DogWithOwners,
): { id: string; display_name: string | null }[] {
  return (dog.dog_owners ?? [])
    .map((link) => link.owner)
    .filter((o): o is { id: string; display_name: string | null } => !!o);
}

export interface Lesson {
  id: number;
  slug: string | null;
  name_th: string;
  sort_order: number;
  summary: string | null;
  content: string | null;
}

export interface DogLessonProgress {
  id: string;
  dog_id: string;
  lesson_id: number;
  taught: boolean;
  taught_by: string | null;
  taught_at: string | null;
  can_do: boolean;
  can_do_by: string | null;
  can_do_at: string | null;
}

export interface PracticeCheckin {
  id: string;
  dog_id: string;
  lesson_id: number;
  owner_id: string | null;
  checked_at: string;
}

export interface SessionPhoto {
  id: string;
  dog_id: string;
  lesson_id: number | null;
  photo_url: string;
  caption: string | null;
  uploaded_by: string | null;
  created_at: string;
}

/** Per-lesson view model used by the dashboard/admin game grid. */
export interface LessonProgressView {
  lesson: Lesson;
  taught: boolean;
  can_do: boolean;
  practiced_count: number;
  progress?: DogLessonProgress;
}

export type ClaimStatus = 'new' | 'contacted' | 'attended' | 'expired';

export interface VoucherCampaign {
  id: string;
  slug: string;
  name: string;
  partner: string | null;
  description: string | null;
  active: boolean;
  max_claims: number | null;
  created_at: string;
}

export interface VoucherClaim {
  id: string;
  campaign_id: string;
  profile_id: string;
  dog_id: string | null;
  code: string;
  contact: string | null;
  phone: string | null;
  line_id: string | null;
  status: ClaimStatus;
  created_at: string;
}

export const STORAGE_BUCKET = 'dog-photos';

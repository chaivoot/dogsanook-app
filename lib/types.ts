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

export type DogSex = 'male' | 'female';
export type ActivityLevel =
  | 'weight_loss'
  | 'senior'
  | 'normal'
  | 'active'
  | 'working'
  | 'puppy';

export interface Dog {
  id: string;
  name: string;
  breed: string | null;
  photo_url: string | null;
  owner_id: string | null;
  notes: string | null;
  created_at: string;
  media_consent: boolean;
  media_consent_at: string | null;
  media_consent_by: string | null;
  // health passport (สมุดสุขภาพน้อง)
  sex: DogSex | null;
  birthdate: string | null;
  neutered: boolean | null;
  weight_kg: number | null;
  height_cm: number | null;
  chest_cm: number | null;
  neck_cm: number | null;
  muzzle_cm: number | null;
  activity_level: ActivityLevel | null;
  food_allergies: string | null;
  drug_allergies: string | null;
  microchip_no: string | null;
  bma_reg_no: string | null;
  bcs: number | null;
  target_weight_kg: number | null;
  current_food: string | null;
  current_food_grams: number | null;
  current_food_kcal_per_100g: number | null;
  current_food_meals: number | null;
  treat_kcal: number | null;
  treat_note: string | null;
}

export interface DogInvite {
  token: string;
  dog_id: string;
  created_by: string | null;
  created_at: string;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  revoked: boolean;
}

export interface WeightLog {
  id: string;
  dog_id: string;
  weight_kg: number;
  measured_at: string;
  logged_by: string | null;
  created_at: string;
}

export interface Vaccination {
  id: string;
  dog_id: string;
  name: string;
  given_on: string | null;
  next_due_on: string | null;
  clinic: string | null;
  logged_by: string | null;
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
  media_type: 'image' | 'video';
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

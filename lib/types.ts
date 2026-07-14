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

export interface Lesson {
  id: number;
  slug: string | null;
  name_th: string;
  sort_order: number;
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

export const STORAGE_BUCKET = 'dog-photos';

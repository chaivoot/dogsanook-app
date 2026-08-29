// Daily Energy Requirement (DER) for dogs.
//
// RER (Resting Energy Requirement) = 70 × (bodyweight_kg ^ 0.75)
// DER = RER × life-stage / activity factor.
//
// Factors follow the common WSAVA / veterinary-nutrition table. They are a
// starting point for a healthy adult — a vet may adjust for individual dogs.

export type ActivityLevel =
  | 'weight_loss'
  | 'senior'
  | 'normal'
  | 'active'
  | 'working'
  | 'puppy';

/** Activity/life-stage → DER multiplier applied to RER. */
const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  weight_loss: 1.0,
  senior: 1.4,
  normal: 1.6, // neutered adult, normal activity
  active: 2.0,
  working: 3.0,
  puppy: 2.5, // < ~4 months ≈ 3.0; this is a mid estimate
};

export const ACTIVITY_LABEL_TH: Record<ActivityLevel, string> = {
  weight_loss: 'กำลังลดน้ำหนัก',
  senior: 'สูงวัย',
  normal: 'ปกติ',
  active: 'แอคทีฟ / ออกกำลังบ่อย',
  working: 'ทำงานหนัก',
  puppy: 'ลูกสุนัข (กำลังโต)',
};

/** RER = 70 × weight^0.75. Returns kcal/day, or null for bad input. */
export function restingEnergy(weightKg: number | null | undefined): number | null {
  if (weightKg == null || !Number.isFinite(weightKg) || weightKg <= 0) return null;
  return 70 * Math.pow(weightKg, 0.75);
}

/**
 * DER in kcal/day. When `neutered` is known and no explicit activity level is
 * given, an intact adult gets a slightly higher factor (1.8 vs 1.6).
 */
export function dailyEnergy(
  weightKg: number | null | undefined,
  opts: { activity?: ActivityLevel | null; neutered?: boolean | null } = {},
): number | null {
  const rer = restingEnergy(weightKg);
  if (rer == null) return null;

  let factor: number;
  if (opts.activity) {
    factor = ACTIVITY_FACTOR[opts.activity];
  } else if (opts.neutered === false) {
    factor = 1.8; // intact adult
  } else {
    factor = ACTIVITY_FACTOR.normal; // 1.6, neutered/unknown adult
  }

  return Math.round(rer * factor);
}

/** Age in whole months from a birthdate (ISO string or Date). */
export function ageInMonths(
  birthdate: string | Date | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!birthdate) return null;
  const b = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
  if (Number.isNaN(b.getTime())) return null;
  let months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) months -= 1;
  return Math.max(0, months);
}

/** Thai age label, e.g. "2 ปี 3 เดือน" / "8 เดือน". */
export function ageLabelTh(birthdate: string | Date | null | undefined): string | null {
  const m = ageInMonths(birthdate);
  if (m == null) return null;
  const years = Math.floor(m / 12);
  const months = m % 12;
  if (years === 0) return `${months} เดือน`;
  if (months === 0) return `${years} ปี`;
  return `${years} ปี ${months} เดือน`;
}

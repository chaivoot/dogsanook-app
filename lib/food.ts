// Turn a dog's DER (kcal/day) into a daily food portion.
//
// grams/day = DER (kcal/day) ÷ food energy density (kcal/gram).
// Typical dry dog food is ~3.3–4.0 kcal/g. We show a range around a
// mid density so the number doesn't pretend to be more precise than it is;
// the real figure comes from the chosen food's label (dogevityfood provides it).

const DENSITY_LOW = 3.3; // kcal/g — richer food → fewer grams
const DENSITY_HIGH = 4.0; // kcal/g

export interface FoodPortion {
  gramsLow: number;
  gramsHigh: number;
  /** Nice midpoint for a single-number display. */
  gramsMid: number;
}

/** Estimated grams/day for a given DER, or null when DER is unknown. */
export function foodPortion(der: number | null | undefined): FoodPortion | null {
  if (der == null || !Number.isFinite(der) || der <= 0) return null;
  const gramsLow = Math.round(der / DENSITY_HIGH / 5) * 5;
  const gramsHigh = Math.round(der / DENSITY_LOW / 5) * 5;
  const gramsMid = Math.round((gramsLow + gramsHigh) / 2 / 5) * 5;
  return { gramsLow, gramsHigh, gramsMid };
}

/** Split a free-text allergy field ("ไก่, ข้าวสาลี") into trimmed items. */
export function splitAllergies(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .split(/[,،、\/]+/) // comma, Thai/CJK comma, slash
    .map((s) => s.trim())
    .filter(Boolean);
}

export const DOGEVITY_URL = 'https://dogevityfood.com';

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

/** Actual daily calories from grams/day × kcal per 100g. */
export function intakeKcal(
  grams: number | null | undefined,
  kcalPer100g: number | null | undefined,
): number | null {
  if (grams == null || kcalPer100g == null) return null;
  if (!Number.isFinite(grams) || !Number.isFinite(kcalPer100g)) return null;
  if (grams <= 0 || kcalPer100g <= 0) return null;
  return Math.round((grams / 100) * kcalPer100g);
}

/** Compare actual intake against DER → feeding assessment (±10% = on target). */
export function feedingStatus(
  intake: number | null,
  der: number | null,
): { label: string; tone: 'under' | 'ok' | 'over'; pct: number } | null {
  if (intake == null || der == null || der <= 0) return null;
  const pct = Math.round((intake / der) * 100);
  if (pct < 90) return { label: 'ให้น้อยกว่าที่ควร', tone: 'under', pct };
  if (pct > 110) return { label: 'ให้มากกว่าที่ควร', tone: 'over', pct };
  return { label: 'ให้พอดีกับ DER', tone: 'ok', pct };
}

export const DOGEVITY_URL = 'https://dogevityfood.com';

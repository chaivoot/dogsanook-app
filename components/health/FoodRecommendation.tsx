import type { Dog } from '@/lib/types';
import { dailyEnergy } from '@/lib/der';
import { foodPortion, splitAllergies, DOGEVITY_URL } from '@/lib/food';

/** DER → daily food portion + a bridge to dogevityfood, honouring allergies. */
export default function FoodRecommendation({ dog }: { dog: Dog }) {
  const der = dailyEnergy(dog.weight_kg, {
    activity: dog.activity_level,
    neutered: dog.neutered,
  });

  // Treats spend part of the daily budget, so the main meal is DER minus
  // treats — keep total (food + treats) on DER, don't stack treats on top.
  const treat = dog.treat_kcal != null ? Number(dog.treat_kcal) : 0;
  const foodBudget = der != null ? Math.max(0, der - treat) : null;
  const portion = foodPortion(foodBudget);

  // Nothing to recommend until we know the weight (→ DER → grams).
  if (!portion || der == null || foodBudget == null) return null;

  const avoid = splitAllergies(dog.food_allergies);

  return (
    <section
      className="rounded-card border p-4"
      style={{
        background:
          'linear-gradient(135deg, rgba(0,132,142,.20), rgba(255,203,5,.08))',
        borderColor: 'rgba(0,132,142,.3)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-teal">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-brand-cream">
            แนะนำอาหารมื้อหลักสำหรับ{dog.name}
          </div>
          <div className="text-xs text-brand-muted">
            ≈ {portion.gramsMid} ก./วัน{' '}
            <span className="text-brand-muted/70">
              ({portion.gramsLow}–{portion.gramsHigh} ก. ตาม kcal ของอาหาร)
            </span>
          </div>
        </div>
      </div>

      {avoid.length > 0 && (
        <p className="mt-3 text-xs text-brand-cream">
          เลี่ยง:{' '}
          {avoid.map((a) => (
            <span
              key={a}
              className="mr-1.5 inline-block rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] text-red-200"
            >
              {a}
            </span>
          ))}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-brand-muted">by dogevityfood</span>
        <a
          href={DOGEVITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-brand-gold px-4 py-2 text-sm font-semibold text-brand-ink"
        >
          ดูอาหารที่เหมาะ →
        </a>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-brand-muted">
        {treat > 0
          ? `คิดจากพลังงานมื้อหลัก ${foodBudget} kcal (DER ${der} − ขนม ${treat}) — ปริมาณจริงขึ้นกับ kcal ของอาหารแต่ละสูตร`
          : `เป็นค่าประมาณจาก DER ${der} kcal/วัน — ปริมาณจริงขึ้นกับพลังงานของอาหารแต่ละสูตร`}
      </p>
    </section>
  );
}

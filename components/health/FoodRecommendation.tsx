import type { Dog } from '@/lib/types';
import { dailyEnergy } from '@/lib/der';
import { foodPortion, splitAllergies } from '@/lib/food';

/**
 * Nutrition-coaching promo: shows the estimated main-meal portion as a hook,
 * then advertises ครูวุฒิ (Certified Pet Nutrition Coach, NAVC) with a call CTA.
 */
export default function FoodRecommendation({ dog }: { dog: Dog }) {
  const der = dailyEnergy(dog.weight_kg, {
    activity: dog.activity_level,
    neutered: dog.neutered,
  });
  const treat = dog.treat_kcal != null ? Number(dog.treat_kcal) : 0;
  const foodBudget = der != null ? Math.max(0, der - treat) : null;
  const portion = foodBudget != null ? foodPortion(foodBudget) : null;
  const avoid = splitAllergies(dog.food_allergies);

  const phone = process.env.NEXT_PUBLIC_CONSULT_PHONE?.trim() || '0819496389';
  const tel = phone.replace(/[^+\d]/g, '');

  return (
    <section
      className="rounded-card border p-4"
      style={{
        background:
          'linear-gradient(135deg, rgba(0,132,142,.20), rgba(255,203,5,.08))',
        borderColor: 'rgba(0,132,142,.3)',
      }}
    >
      {/* portion hook (only when we can compute it) */}
      {portion && der != null && (
        <>
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
                แนะนำมื้อหลักสำหรับ{dog.name}
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

          <p className="mt-2 text-[11px] leading-relaxed text-brand-muted">
            {treat > 0
              ? `คิดจากพลังงานมื้อหลัก ${foodBudget} kcal (DER ${der} − ขนม ${treat})`
              : `เป็นค่าประมาณจาก DER ${der} kcal/วัน`}{' '}
            — ปริมาณจริงขึ้นกับ kcal ของอาหารแต่ละสูตร
          </p>

          <div className="my-4 border-t border-white/10" />
        </>
      )}

      {/* ครูวุฒิ nutrition-coaching ad */}
      <div className="flex items-center gap-2">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffcb05"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
        <span className="text-sm font-semibold text-brand-cream">
          ออกแบบมื้ออาหารเฉพาะน้อง โดยครูวุฒิ
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-brand-muted">
        <span className="text-brand-gold">Certified Pet Nutrition Coach (NAVC)</span> —
        ให้คำปรึกษาและออกแบบมื้ออาหารให้เหมาะกับน้องของคุณโดยเฉพาะ
      </p>
      <a
        href={`tel:${tel}`}
        className="mt-3 flex items-center justify-center gap-2 rounded-full bg-brand-gold px-5 py-2.5 text-sm font-semibold text-brand-ink"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        โทรปรึกษาออกแบบมื้ออาหาร
      </a>
    </section>
  );
}

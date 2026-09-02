import type { Dog } from '@/lib/types';
import {
  restingEnergy,
  dailyEnergy,
  activityFactor,
  bcsStatus,
  ageLabelTh,
} from '@/lib/der';
import { intakeKcal, feedingStatus } from '@/lib/food';
import SubmitButton from '@/components/SubmitButton';
import { saveCurrentFood } from '@/app/dashboard/actions';
import RingStat from './RingStat';
import FoodRecommendation from './FoodRecommendation';

const SEX_TH: Record<string, string> = { male: 'เพศผู้', female: 'เพศเมีย' };

function SummaryCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'green';
}) {
  return (
    <div className="flex-1 rounded-2xl bg-brand-card px-3 py-3 text-center text-brand-ink">
      <div className="text-[11px] text-brand-mutedInk">{label}</div>
      <div
        className={`mt-0.5 text-lg font-bold ${
          tone === 'green' ? 'text-brand-greenDark' : ''
        }`}
      >
        {value}
      </div>
    </div>
  );
}

/** The "โภชนาการ" tab — RER / DER / BCS / weight rings, then food advice. */
export default function NutritionDashboard({ dog }: { dog: Dog }) {
  const rer = restingEnergy(dog.weight_kg);
  const der = dailyEnergy(dog.weight_kg, {
    activity: dog.activity_level,
    neutered: dog.neutered,
  });
  const factor = activityFactor({
    activity: dog.activity_level,
    neutered: dog.neutered,
  });
  const bcs = bcsStatus(dog.bcs);
  const age = ageLabelTh(dog.birthdate);

  const hasWeight = dog.weight_kg != null;

  // weight-vs-target: full ring when on target, shrinking as it drifts —
  // and coloured so being over target reads as a warning, not "all good".
  const target = dog.target_weight_kg;
  const w = hasWeight ? Number(dog.weight_kg) : null;
  const weightFrac =
    w != null && target
      ? Math.max(0.1, 1 - Math.min(1, Math.abs(w - Number(target)) / Number(target)))
      : hasWeight
        ? 1
        : 0;
  let weightColor = '#006b73'; // no target → neutral teal, no implied verdict
  let weightFooter = target ? `เป้า ${target} กก.` : 'ตั้งเป้าได้ในแท็บน้องหมา';
  if (w != null && target) {
    const t = Number(target);
    if (w > t * 1.05) {
      weightColor = '#e0894a'; // over target → amber warning
      weightFooter = `เกินเป้า ${(w - t).toFixed(1)} กก. (เป้า ${target})`;
    } else if (w < t * 0.95) {
      weightColor = '#3b82f6'; // under target → blue
      weightFooter = `ต่ำกว่าเป้า ${(t - w).toFixed(1)} กก. (เป้า ${target})`;
    } else {
      weightColor = '#5f9a34'; // on target → green
      weightFooter = `ตรงเป้า ${target} กก.`;
    }
  }

  const bcsTone =
    bcs?.tone === 'ideal' ? '#5f9a34' : bcs?.tone === 'low' ? '#3b82f6' : '#e0894a';

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex items-center gap-3">
        <div
          className="shrink-0 rounded-full p-[3px]"
          style={{ background: 'linear-gradient(135deg,#ffcb05,#00848e)' }}
        >
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-brand-bg">
            {dog.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dog.photo_url} alt={dog.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl">🐶</span>
            )}
          </div>
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-brand-cream">{dog.name}</h1>
          <p className="truncate text-xs text-brand-muted">
            {dog.breed || 'ไม่ระบุพันธุ์'}
            {age ? ` · ${age}` : ''}
            {dog.sex ? ` · ${SEX_TH[dog.sex]}` : ''}
            {dog.neutered === true ? ' · ทำหมัน' : ''}
          </p>
        </div>
      </div>

      {!hasWeight && (
        <p className="rounded-card border border-brand-gold/25 bg-brand-gold/10 px-4 py-3 text-sm text-brand-cream">
          ใส่น้ำหนักน้องในแท็บ “น้องหมา” เพื่อคำนวณพลังงานและปริมาณอาหาร
        </p>
      )}

      {/* summary row */}
      <div className="flex gap-3">
        <SummaryCell label="น้ำหนัก" value={hasWeight ? `${dog.weight_kg} กก.` : '– กก.'} />
        <SummaryCell label="BCS" value={dog.bcs != null ? `${dog.bcs}/9` : '–'} />
        <SummaryCell
          label="สถานะ"
          value={bcs?.label ?? '—'}
          tone={bcs?.tone === 'ideal' ? 'green' : undefined}
        />
      </div>

      {/* rings */}
      <div className="grid grid-cols-2 gap-3">
        <RingStat
          title="RER"
          subtitle="แคลอรีขณะพัก/วัน"
          center={rer != null ? String(Math.round(rer)) : '–'}
          unit="kcal/วัน"
          footer="พลังงานพื้นฐาน"
          fraction={rer != null && der != null ? rer / der : 0}
          color="#006b73"
        />
        <RingStat
          title="DER"
          subtitle="แคลอรีต่อวัน"
          center={der != null ? String(der) : '–'}
          unit="kcal/วัน"
          footer={`${factor}× RER`}
          fraction={Math.min(1, factor / 3)}
          color="#e6b800"
        />
        <RingStat
          title="BCS"
          subtitle="ความสมบูรณ์ร่างกาย"
          center={dog.bcs != null ? String(dog.bcs) : '–'}
          unit="/9"
          footer={bcs?.label ?? 'ยังไม่ประเมิน'}
          fraction={dog.bcs != null ? dog.bcs / 9 : 0}
          color={bcsTone}
        />
        <RingStat
          title="น้ำหนัก"
          center={hasWeight ? String(dog.weight_kg) : '–'}
          unit="กก."
          footer={weightFooter}
          fraction={weightFrac}
          color={weightColor}
        />
      </div>

      <CurrentFoodCard dog={dog} rer={rer != null ? Math.round(rer) : null} der={der} />

      <FoodRecommendation dog={dog} />
    </div>
  );
}

function CurrentFoodCard({
  dog,
  rer,
  der,
}: {
  dog: Dog;
  rer: number | null;
  der: number | null;
}) {
  const foodIntake = intakeKcal(dog.current_food_grams, dog.current_food_kcal_per_100g);
  const treat = dog.treat_kcal != null ? Number(dog.treat_kcal) : null;
  const total =
    foodIntake != null || treat != null ? (foodIntake ?? 0) + (treat ?? 0) : null;
  const status = feedingStatus(total, rer, der);
  // "treats ≤ 10% of daily calories" guideline — key for a training brand.
  const treatPct = treat != null && der ? Math.round((treat / der) * 100) : null;
  const treatOverLimit = treatPct != null && treatPct > 10;
  const hasFood =
    dog.current_food != null || dog.current_food_grams != null || treat != null;

  const toneCls =
    status?.tone === 'ok'
      ? 'text-brand-green'
      : status?.tone === 'over'
        ? 'text-[#f0a0a0]'
        : 'text-brand-gold';

  return (
    <section className="rounded-card border border-white/5 bg-brand-bgSoft p-4">
      <div className="mb-3 flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffcb05" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2M5 2v20M15 2c-1.5 1-2 3-2 6s.5 5 2 6v8" />
        </svg>
        <span className="text-[15px] font-semibold text-brand-cream">อาหารปัจจุบัน</span>
      </div>

      {hasFood ? (
        <div className="space-y-3">
          {(dog.current_food != null || dog.current_food_grams != null) && (
            <div className="rounded-2xl border border-white/5 bg-brand-bg/50 px-4 py-3">
              <div className="text-sm font-medium text-brand-cream">
                {dog.current_food || 'อาหารมื้อหลัก'}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-muted">
                {dog.current_food_grams != null && <span>{dog.current_food_grams} ก./วัน</span>}
                {dog.current_food_meals != null && <span>{dog.current_food_meals} มื้อ/วัน</span>}
                {dog.current_food_kcal_per_100g != null && (
                  <span>{dog.current_food_kcal_per_100g} kcal/100ก.</span>
                )}
                {foodIntake != null && (
                  <span className="text-brand-cream">≈ {foodIntake} kcal</span>
                )}
              </div>
            </div>
          )}

          {treat != null && (
            <div className="rounded-2xl border border-white/5 bg-brand-bg/50 px-4 py-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-brand-cream">
                  ขนมฝึก {dog.treat_note ? `· ${dog.treat_note}` : ''}
                </span>
                <span className="text-xs text-brand-cream">≈ {treat} kcal</span>
              </div>
              {treatPct != null && (
                <div
                  className={`mt-1 text-xs ${
                    treatOverLimit ? 'text-[#f0a0a0]' : 'text-brand-muted'
                  }`}
                >
                  {treatPct}% ของพลังงานต่อวัน
                  {treatOverLimit ? ' · เกิน 10% ที่แนะนำ ควรลดขนม' : ' · อยู่ในเกณฑ์ ≤10%'}
                </div>
              )}
            </div>
          )}

          {total != null && der != null && status ? (
            <div className="rounded-2xl border border-white/5 bg-brand-bg/50 px-4 py-3">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-brand-muted">ได้รับจริงรวม (อาหาร+ขนม)</span>
                <span className="font-semibold text-brand-cream">≈ {total} kcal/วัน</span>
              </div>
              {/* track spans 0–140% of DER; the RER–DER band is the green zone */}
              <div className="relative mt-2 h-2 rounded-full bg-[#3a2f27]">
                {rer != null && (
                  <div
                    className="absolute inset-y-0 rounded-full bg-brand-green/25"
                    style={{
                      left: `${(rer / der) * 100 / 1.4}%`,
                      width: `${(1 - rer / der) * 100 / 1.4}%`,
                    }}
                  />
                )}
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${Math.min(140, status.pct) / 1.4}%`,
                    background:
                      status.tone === 'ok'
                        ? '#7cb342'
                        : status.tone === 'over'
                          ? '#e0894a'
                          : '#ffcb05',
                  }}
                />
                {rer != null && (
                  <span
                    className="absolute -top-0.5 h-3 w-0.5 bg-white/40"
                    style={{ left: `${(rer / der) * 100 / 1.4}%` }}
                  />
                )}
                <span
                  className="absolute -top-0.5 h-3 w-0.5 bg-white/60"
                  style={{ left: `${100 / 1.4}%` }}
                />
              </div>
              <div className={`mt-2 text-xs font-medium ${toneCls}`}>
                {status.label} · {status.pct}% ของ DER
              </div>
              {rer != null && (
                <div className="mt-1 text-[11px] text-brand-muted">
                  ช่วงเหมาะสม {rer}–{der} kcal/วัน (RER–DER)
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-brand-muted">
              ใส่ปริมาณอาหาร (กรัม/วัน + kcal/100ก.) และ/หรือขนมฝึก เพื่อเทียบกับ DER
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-brand-muted">
          ยังไม่ได้บันทึกอาหารที่น้องกินอยู่ — เพิ่มด้านล่างเพื่อเทียบกับ DER
        </p>
      )}

      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-brand-gold">
          {hasFood ? 'แก้ไขอาหารปัจจุบัน' : '+ บันทึกอาหารปัจจุบัน'}
        </summary>
        <form action={saveCurrentFood} className="mt-3 space-y-3">
          <input type="hidden" name="dogId" value={dog.id} />
          <div>
            <label className="label">ยี่ห้อ / ชื่ออาหาร</label>
            <input
              name="current_food"
              defaultValue={dog.current_food ?? ''}
              className="input"
              placeholder="เช่น Royal Canin Medium Adult"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="label">กรัม/วัน</label>
              <input
                name="current_food_grams"
                type="number"
                step="1"
                min="0"
                defaultValue={dog.current_food_grams ?? ''}
                className="input"
              />
            </div>
            <div>
              <label className="label">มื้อ/วัน</label>
              <input
                name="current_food_meals"
                type="number"
                step="1"
                min="0"
                defaultValue={dog.current_food_meals ?? ''}
                className="input"
              />
            </div>
            <div>
              <label className="label">kcal/100ก.</label>
              <input
                name="current_food_kcal_per_100g"
                type="number"
                step="1"
                min="0"
                defaultValue={dog.current_food_kcal_per_100g ?? ''}
                className="input"
                placeholder="เช่น 380"
              />
            </div>
          </div>
          <p className="text-[11px] text-brand-muted">
            kcal/100ก. ดูได้จากถุงอาหาร (Metabolizable Energy) — ใส่เพื่อเทียบกับ DER
          </p>

          <div className="border-t border-white/10 pt-3">
            <div className="mb-1 text-sm font-medium text-brand-cream">ขนมฝึก (ต่อวัน)</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">ขนมอะไร</label>
                <input
                  name="treat_note"
                  defaultValue={dog.treat_note ?? ''}
                  className="input"
                  placeholder="เช่น ตับอบแห้ง, ไก่ฉีก"
                />
              </div>
              <div>
                <label className="label">kcal/วัน (ประมาณ)</label>
                <input
                  name="treat_kcal"
                  type="number"
                  step="1"
                  min="0"
                  defaultValue={dog.treat_kcal ?? ''}
                  className="input"
                  placeholder="เช่น 60"
                />
              </div>
            </div>
            <p className="mt-1 text-[11px] text-brand-muted">
              ขนมช่วงฝึกก็มีแคลอรี — ควรไม่เกิน 10% ของพลังงานต่อวัน (DER)
            </p>
          </div>

          <SubmitButton pendingText="กำลังบันทึก…">บันทึกอาหาร</SubmitButton>
        </form>
      </details>
    </section>
  );
}

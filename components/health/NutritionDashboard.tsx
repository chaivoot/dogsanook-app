import type { Dog } from '@/lib/types';
import {
  restingEnergy,
  dailyEnergy,
  activityFactor,
  bcsStatus,
  ageLabelTh,
} from '@/lib/der';
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

  // weight-vs-target: full ring when on target, shrinking as it drifts
  const target = dog.target_weight_kg;
  const weightFrac =
    hasWeight && target
      ? Math.max(0.1, 1 - Math.min(1, Math.abs(Number(dog.weight_kg) - Number(target)) / Number(target)))
      : hasWeight
        ? 1
        : 0;

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
          subtitle="พลังงานขณะพัก"
          center={rer != null ? String(Math.round(rer)) : '–'}
          unit="kcal/วัน"
          footer="พลังงานพื้นฐาน"
          fraction={rer != null && der != null ? rer / der : 0}
          color="#006b73"
        />
        <RingStat
          title="DER"
          subtitle="พลังงานต่อวัน"
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
          footer={target ? `เป้า ${target} กก.` : 'ตั้งเป้าได้ในแท็บน้องหมา'}
          fraction={weightFrac}
          color="#5f9a34"
        />
      </div>

      <FoodRecommendation dog={dog} />
    </div>
  );
}

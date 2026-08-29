import type { Dog, Vaccination, WeightLog } from '@/lib/types';
import { dailyEnergy, ageLabelTh, ACTIVITY_LABEL_TH, type ActivityLevel } from '@/lib/der';
import SubmitButton from '@/components/SubmitButton';
import ResetForm from '@/components/ResetForm';
import DerRing from './DerRing';
import WeightTrend from './WeightTrend';
import {
  saveDogHealth,
  logWeight,
  addVaccination,
  deleteVaccination,
} from '@/app/dashboard/actions';

const ACTIVITY_OPTIONS: ActivityLevel[] = [
  'weight_loss',
  'senior',
  'normal',
  'active',
  'working',
  'puppy',
];

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}

const SEX_TH: Record<string, string> = { male: 'เพศผู้', female: 'เพศเมีย' };

/** Whole days from today until `iso` (negative = overdue), date-only. */
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date();
  const a = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
  const b = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((a - b) / 86400000);
}

/** The next appointment: nearest upcoming due date, else the least-overdue. */
function nextDueVaccine(list: Vaccination[]): { v: Vaccination; days: number } | null {
  const withDays = list
    .filter((v) => v.next_due_on)
    .map((v) => ({ v, days: daysUntil(v.next_due_on)! }))
    .filter((x) => x.days != null);
  if (withDays.length === 0) return null;
  const upcoming = withDays.filter((x) => x.days >= 0).sort((a, b) => a.days - b.days);
  if (upcoming.length > 0) return upcoming[0];
  // all overdue → closest to today (largest, i.e. least negative)
  return withDays.sort((a, b) => b.days - a.days)[0];
}

/** Every vaccine whose next dose is due within `within` days (incl. overdue). */
function dueSoonVaccines(
  list: Vaccination[],
  within = 31,
): { v: Vaccination; days: number }[] {
  return list
    .filter((v) => v.next_due_on)
    .map((v) => ({ v, days: daysUntil(v.next_due_on)! }))
    .filter((x) => x.days != null && x.days < within)
    .sort((a, b) => a.days - b.days);
}

/** Keep only the most recent dose of each vaccine name (by given date), so a
 *  new booster supersedes the old reminder instead of double-counting. */
function latestPerName(list: Vaccination[]): Vaccination[] {
  const byName = new Map<string, Vaccination>();
  for (const v of list) {
    const key = v.name.trim();
    const cur = byName.get(key);
    const a = v.given_on ? Date.parse(v.given_on) : -Infinity;
    const b = cur?.given_on ? Date.parse(cur.given_on) : -Infinity;
    if (!cur || a > b) byName.set(key, v);
  }
  return [...byName.values()];
}

/** Group every dose by vaccine name, newest dose first within each group. */
function groupByName(list: Vaccination[]): { name: string; doses: Vaccination[] }[] {
  const map = new Map<string, Vaccination[]>();
  for (const v of list) {
    const key = v.name.trim();
    const arr = map.get(key) ?? [];
    arr.push(v);
    map.set(key, arr);
  }
  return [...map.entries()].map(([name, doses]) => ({
    name,
    doses: doses.sort((a, b) => (b.given_on ?? '').localeCompare(a.given_on ?? '')),
  }));
}

const isoToday = () => new Date().toISOString().slice(0, 10);
const isoPlusYear = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

/** One vaccine group in the full list: dose history + a "record new dose". */
function VaccineGroup({
  dogId,
  name,
  doses,
}: {
  dogId: string;
  name: string;
  doses: Vaccination[];
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-brand-bg/50 p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-brand-cream">{name}</div>
        <span className="text-xs text-brand-muted">{doses.length} เข็ม</span>
      </div>
      <ul className="mt-2 space-y-1.5">
        {doses.map((v, i) => (
          <li key={v.id} className="flex items-center gap-2 text-xs">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${
                i === 0 ? 'bg-brand-green' : 'bg-white/20'
              }`}
            />
            <span className="min-w-0 flex-1 text-brand-muted">
              {fmtDate(v.given_on)}
              {v.clinic ? ` · ${v.clinic}` : ''}
              {v.next_due_on ? ` · ถัดไป ${fmtDate(v.next_due_on)}` : ''}
            </span>
            <form action={deleteVaccination}>
              <input type="hidden" name="dogId" value={dogId} />
              <input type="hidden" name="vaccId" value={v.id} />
              <button type="submit" className="text-brand-muted hover:text-red-300">
                ลบ
              </button>
            </form>
          </li>
        ))}
      </ul>
      <details className="mt-2">
        <summary className="cursor-pointer text-xs text-brand-gold">
          ฉีดเพิ่ม (บันทึกเข็มใหม่)
        </summary>
        <RecordDoseForm dogId={dogId} name={name} />
      </details>
    </div>
  );
}

/** Pre-filled "record a new dose" form (vaccine name locked, 1-year default). */
function RecordDoseForm({ dogId, name }: { dogId: string; name: string }) {
  return (
    <ResetForm action={addVaccination} className="mt-2 space-y-2">
      <input type="hidden" name="dogId" value={dogId} />
      <input type="hidden" name="name" value={name} />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">วันที่ฉีด</label>
          <input type="date" name="given_on" defaultValue={isoToday()} className="input" />
        </div>
        <div>
          <label className="label">เข็มถัดไป</label>
          <input type="date" name="next_due_on" defaultValue={isoPlusYear()} className="input" />
        </div>
      </div>
      <input name="clinic" className="input" placeholder="โรงพยาบาลสัตว์ (ไม่บังคับ)" />
      <p className="text-[11px] text-brand-muted">
        ปกติกระตุ้นทุก 1 ปี — ปรับวันได้ตามที่สัตวแพทย์แนะนำ
      </p>
      <SubmitButton>บันทึกเข็มใหม่</SubmitButton>
    </ResetForm>
  );
}

/** One "เข็มถัดไป" reminder row for a vaccine that is due soon / overdue.
 *  Tapping "✓ ฉีดแล้ว" logs the new dose right here — no scrolling. */
function VaccineDueRow({
  v,
  days,
  dogId,
}: {
  v: Vaccination;
  days: number;
  dogId: string;
}) {
  const overdue = days < 0;
  const countdown =
    days === 0 ? 'วันนี้' : overdue ? `เลย ${Math.abs(days)} วัน` : `อีก ${days} วัน`;
  return (
    <details className="overflow-hidden rounded-2xl border border-white/5 bg-brand-bg/50">
      <summary className="flex cursor-pointer list-none items-center gap-2.5 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            overdue ? 'bg-red-500/15' : 'bg-brand-gold/15'
          }`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={overdue ? '#f0a0a0' : '#ffcb05'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-brand-cream">{v.name}</div>
          <div className="truncate text-[11px] text-brand-muted">
            {fmtDate(v.next_due_on)} ·{' '}
            <span className={overdue ? 'text-[#f0a0a0]' : 'text-brand-gold'}>{countdown}</span>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-brand-gold px-3 py-1.5 text-xs font-semibold text-brand-ink">
          ฉีดแล้ว
        </span>
      </summary>
      <div className="border-t border-white/5 px-3 py-2.5">
        <RecordDoseForm dogId={dogId} name={v.name} />
      </div>
    </details>
  );
}

function Measure({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-2xl bg-brand-card px-2 py-3.5 text-center text-brand-ink">
      <div className="text-[11px] text-brand-mutedInk">{label}</div>
      <div className="mt-0.5 text-2xl font-bold leading-none">
        {value ?? '–'}
        {value != null && (
          <span className="text-[11px] font-medium text-brand-mutedInk"> cm</span>
        )}
      </div>
    </div>
  );
}

function Chip({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'teal';
}) {
  if (tone === 'teal') {
    return (
      <span className="rounded-full bg-brand-teal/15 px-3 py-1 text-xs text-[#4fd1c5]">
        {children}
      </span>
    );
  }
  return (
    <span className="rounded-full border border-white/[.06] bg-brand-bgSoft px-3 py-1 text-xs text-brand-cream">
      {children}
    </span>
  );
}

export default function HealthPassport({
  dog,
  weightLogs,
  vaccinations,
}: {
  dog: Dog;
  weightLogs: WeightLog[];
  vaccinations: Vaccination[];
}) {
  const der = dailyEnergy(dog.weight_kg, {
    activity: dog.activity_level,
    neutered: dog.neutered,
  });
  const age = ageLabelTh(dog.birthdate);
  const hasMeasures =
    dog.chest_cm != null || dog.neck_cm != null || dog.muzzle_cm != null;
  const latestVacc = vaccinations[0] ?? null;
  // Reminders consider only the latest dose per vaccine, so logging a booster
  // rolls the reminder forward automatically.
  const latestDoses = latestPerName(vaccinations);
  const nextDue = nextDueVaccine(latestDoses);
  const dueSoon = dueSoonVaccines(latestDoses, 31);
  const vaccineGroups = groupByName(vaccinations);

  return (
    <section className="overflow-hidden rounded-card border border-white/5 bg-brand-bgSoft">
      {/* ── hero ─────────────────────────────────────────────── */}
      <div className="px-5 pb-5 pt-6 text-center">
        <div
          className="mx-auto rounded-full p-[4px]"
          style={{
            width: 132,
            height: 132,
            background: 'linear-gradient(135deg, #ffcb05, #00848e)',
          }}
        >
          <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-brand-bg">
            {dog.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dog.photo_url}
                alt={dog.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-6xl">🐶</span>
            )}
          </div>
        </div>

        <h1 className="mt-3.5 text-2xl font-bold text-brand-cream">{dog.name}</h1>
        <p className="mt-0.5 text-sm text-brand-muted">
          {dog.breed || 'ไม่ระบุพันธุ์'}
          {dog.sex ? ` · ${SEX_TH[dog.sex]}` : ''}
        </p>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {age && <Chip>อายุ {age}</Chip>}
          {dog.neutered === true && <Chip>ทำหมันแล้ว</Chip>}
          {dog.neutered === false && <Chip>ยังไม่ทำหมัน</Chip>}
          {dog.microchip_no && <Chip tone="teal">ไมโครชิป ✓</Chip>}
        </div>
      </div>

      <div className="space-y-5 px-5 pb-6">
        {/* ── weight + DER ──────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/5 bg-brand-bg/50 p-4">
            <div className="text-xs text-brand-muted">น้ำหนัก</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-brand-gold">
                {dog.weight_kg ?? '–'}
              </span>
              <span className="text-sm text-brand-muted">กก.</span>
            </div>
            <WeightTrend logs={weightLogs} />
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-brand-bg/50 p-4">
            {der != null ? (
              <DerRing der={der} />
            ) : (
              <div className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full border border-dashed border-white/15 text-center text-[10px] text-brand-muted">
                ใส่น้ำหนัก
              </div>
            )}
            <div>
              <div className="text-xs text-brand-muted">พลังงานที่ต้องการ</div>
              <div className="mt-1 text-sm font-semibold text-brand-cream">DER ต่อวัน</div>
              <div className="mt-0.5 text-xs text-brand-teal">
                {der != null ? 'คำนวณจากน้ำหนัก' : 'ยังคำนวณไม่ได้'}
              </div>
            </div>
          </div>
        </div>

        {/* ── measurements ──────────────────────────────────── */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[15px] font-semibold text-brand-cream">
              ขนาดตัว{' '}
              <span className="text-xs font-normal text-brand-muted">
                · ไว้เลือกไซซ์ตอนช้อป
              </span>
            </span>
          </div>
          {hasMeasures ? (
            <div className="grid grid-cols-3 gap-2.5">
              <Measure label="รอบอก" value={dog.chest_cm} />
              <Measure label="รอบคอ" value={dog.neck_cm} />
              <Measure label="รอบปาก" value={dog.muzzle_cm} />
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 px-3 py-3 text-center text-xs text-brand-muted">
              ยังไม่ได้บันทึกขนาดตัว — เพิ่มได้ที่ “แก้ไขข้อมูลสุขภาพ” ด้านล่าง
            </p>
          )}
        </div>

        {/* ── health ────────────────────────────────────────── */}
        <div>
          <div className="mb-3 text-[15px] font-semibold text-brand-cream">สุขภาพ</div>
          <div className="space-y-2.5">
            {/* vaccines due within 31 days (incl. overdue) — show them all */}
            {dueSoon.length > 0 ? (
              dueSoon.map((x) => (
                <VaccineDueRow key={x.v.id} v={x.v} days={x.days} dogId={dog.id} />
              ))
            ) : nextDue ? (
              // nothing due this month — show the next one as a calm info row
              <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-brand-bg/50 px-3.5 py-3">
                <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-brand-green/15">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7ab648" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-brand-cream">
                    วัคซีนครบถ้วน ✓
                  </div>
                  <div className="text-xs text-brand-muted">
                    เข็มถัดไป {nextDue.v.name} · {fmtDate(nextDue.v.next_due_on)}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-brand-muted">อีก {nextDue.days} วัน</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-brand-bg/50 px-3.5 py-3">
                <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-brand-green/15">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7ab648" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-brand-cream">
                    {latestVacc ? latestVacc.name : 'วัคซีน'}
                  </div>
                  <div className="text-xs text-brand-muted">
                    {latestVacc
                      ? `ฉีดล่าสุด ${fmtDate(latestVacc.given_on)}`
                      : 'ยังไม่มีประวัติวัคซีน'}
                  </div>
                </div>
              </div>
            )}

            {/* allergies */}
            <div className="flex gap-2.5">
              <div className="flex-1 rounded-2xl border border-white/5 bg-brand-bg/50 px-3.5 py-3">
                <div className="text-xs text-brand-muted">แพ้อาหาร</div>
                <div
                  className={`mt-0.5 text-[13px] font-medium ${
                    dog.food_allergies ? 'text-[#f0a0a0]' : 'text-brand-cream'
                  }`}
                >
                  {dog.food_allergies || 'ไม่มี / ยังไม่ระบุ'}
                </div>
              </div>
              <div className="flex-1 rounded-2xl border border-white/5 bg-brand-bg/50 px-3.5 py-3">
                <div className="text-xs text-brand-muted">แพ้ยา</div>
                <div
                  className={`mt-0.5 text-[13px] font-medium ${
                    dog.drug_allergies ? 'text-[#f0a0a0]' : 'text-brand-cream'
                  }`}
                >
                  {dog.drug_allergies || 'ไม่มี / ยังไม่ระบุ'}
                </div>
              </div>
            </div>
          </div>

          {/* manage vaccines, grouped by type with per-vaccine "ฉีดเพิ่ม" */}
          {vaccineGroups.length > 0 && (
            <details className="mt-2.5">
              <summary className="cursor-pointer text-sm text-brand-gold">
                ดูวัคซีนทั้งหมด ({vaccinations.length})
              </summary>
              <div className="mt-2 space-y-2">
                {vaccineGroups.map((g) => (
                  <VaccineGroup
                    key={g.name}
                    dogId={dog.id}
                    name={g.name}
                    doses={g.doses}
                  />
                ))}
              </div>
            </details>
          )}

          <details className="mt-2.5">
            <summary className="cursor-pointer text-sm text-brand-gold">
              + เพิ่มวัคซีน
            </summary>
            <ResetForm action={addVaccination} className="mt-3 space-y-2">
              <input type="hidden" name="dogId" value={dog.id} />
              <input name="name" required className="input" placeholder="เช่น รวม 5 in 1" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">วันที่ฉีด</label>
                  <input type="date" name="given_on" className="input" />
                </div>
                <div>
                  <label className="label">เข็มถัดไป</label>
                  <input type="date" name="next_due_on" className="input" />
                </div>
              </div>
              <input name="clinic" className="input" placeholder="โรงพยาบาลสัตว์ (ไม่บังคับ)" />
              <SubmitButton>เพิ่ม</SubmitButton>
            </ResetForm>
          </details>
        </div>

        {/* ── quick weight log ──────────────────────────────── */}
        <ResetForm action={logWeight} className="flex items-end gap-2">
          <input type="hidden" name="dogId" value={dog.id} />
          <div className="flex-1">
            <label className="label">บันทึกน้ำหนักวันนี้ (กก.)</label>
            <input
              name="weight_kg"
              type="number"
              step="0.1"
              min="0"
              className="input"
              placeholder="เช่น 12.4"
            />
          </div>
          <SubmitButton pendingText="…">บันทึก</SubmitButton>
        </ResetForm>

        {/* ── full edit form ────────────────────────────────── */}
        <details>
          <summary className="cursor-pointer text-sm text-brand-gold">
            แก้ไขข้อมูลสุขภาพทั้งหมด
          </summary>
          <form action={saveDogHealth} className="mt-3 space-y-3">
            <input type="hidden" name="dogId" value={dog.id} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">เพศ</label>
                <select name="sex" defaultValue={dog.sex ?? ''} className="input">
                  <option value="">— ไม่ระบุ —</option>
                  <option value="male">ผู้</option>
                  <option value="female">เมีย</option>
                </select>
              </div>
              <div>
                <label className="label">วันเกิด</label>
                <input
                  type="date"
                  name="birthdate"
                  defaultValue={dog.birthdate ?? ''}
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">ทำหมัน</label>
                <select
                  name="neutered"
                  defaultValue={dog.neutered == null ? '' : dog.neutered ? 'yes' : 'no'}
                  className="input"
                >
                  <option value="">— ไม่ระบุ —</option>
                  <option value="yes">ทำหมันแล้ว</option>
                  <option value="no">ยังไม่ทำหมัน</option>
                </select>
              </div>
              <div>
                <label className="label">ระดับกิจกรรม</label>
                <select
                  name="activity_level"
                  defaultValue={dog.activity_level ?? ''}
                  className="input"
                >
                  <option value="">— ปกติ —</option>
                  {ACTIVITY_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {ACTIVITY_LABEL_TH[a]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">น้ำหนัก (กก.)</label>
                <input
                  name="weight_kg"
                  type="number"
                  step="0.1"
                  min="0"
                  defaultValue={dog.weight_kg ?? ''}
                  className="input"
                />
              </div>
              <div>
                <label className="label">ส่วนสูง (ซม.)</label>
                <input
                  name="height_cm"
                  type="number"
                  step="0.1"
                  min="0"
                  defaultValue={dog.height_cm ?? ''}
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">น้ำหนักเป้าหมาย (กก.)</label>
                <input
                  name="target_weight_kg"
                  type="number"
                  step="0.1"
                  min="0"
                  defaultValue={dog.target_weight_kg ?? ''}
                  className="input"
                  placeholder="เช่น 7"
                />
              </div>
              <div>
                <label className="label">BCS · ความสมบูรณ์ (1–9)</label>
                <select name="bcs" defaultValue={dog.bcs ?? ''} className="input">
                  <option value="">— ไม่ระบุ —</option>
                  <option value="1">1 · ผอมมาก</option>
                  <option value="2">2</option>
                  <option value="3">3 · ผอม</option>
                  <option value="4">4</option>
                  <option value="5">5 · สมส่วน (พอดี)</option>
                  <option value="6">6</option>
                  <option value="7">7 · ท้วม</option>
                  <option value="8">8</option>
                  <option value="9">9 · อ้วนมาก</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">ขนาดตัว (ซม.) — รอบอก / รอบคอ / รอบปาก</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  name="chest_cm"
                  type="number"
                  step="0.1"
                  min="0"
                  defaultValue={dog.chest_cm ?? ''}
                  className="input"
                  placeholder="รอบอก"
                />
                <input
                  name="neck_cm"
                  type="number"
                  step="0.1"
                  min="0"
                  defaultValue={dog.neck_cm ?? ''}
                  className="input"
                  placeholder="รอบคอ"
                />
                <input
                  name="muzzle_cm"
                  type="number"
                  step="0.1"
                  min="0"
                  defaultValue={dog.muzzle_cm ?? ''}
                  className="input"
                  placeholder="รอบปาก"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">แพ้อาหาร</label>
                <input
                  name="food_allergies"
                  defaultValue={dog.food_allergies ?? ''}
                  className="input"
                  placeholder="เช่น ไก่, ข้าวสาลี"
                />
              </div>
              <div>
                <label className="label">แพ้ยา</label>
                <input
                  name="drug_allergies"
                  defaultValue={dog.drug_allergies ?? ''}
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">เลขไมโครชิป (ไม่บังคับ)</label>
                <input
                  name="microchip_no"
                  defaultValue={dog.microchip_no ?? ''}
                  className="input"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="label">ทะเบียน กทม. (ไม่บังคับ)</label>
                <input
                  name="bma_reg_no"
                  defaultValue={dog.bma_reg_no ?? ''}
                  className="input"
                />
              </div>
            </div>

            <SubmitButton pendingText="กำลังบันทึก…">บันทึกข้อมูลสุขภาพ</SubmitButton>
          </form>
        </details>
      </div>
    </section>
  );
}

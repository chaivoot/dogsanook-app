import type { Dog, Vaccination, WeightLog } from '@/lib/types';
import { dailyEnergy, ageLabelTh, ACTIVITY_LABEL_TH, type ActivityLevel } from '@/lib/der';
import SubmitButton from '@/components/SubmitButton';
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

function Measure({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-2xl bg-brand-card px-2 py-3 text-center text-brand-ink">
      <div className="text-[11px] text-brand-mutedInk">{label}</div>
      <div className="mt-0.5 text-xl font-bold">
        {value ?? '–'}
        {value != null && (
          <span className="text-[11px] font-medium text-brand-mutedInk"> cm</span>
        )}
      </div>
    </div>
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

  return (
    <section className="dark-card space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-brand-gold">สมุดสุขภาพน้อง</h2>
        {age && <span className="text-sm text-brand-muted">{age}</span>}
      </div>

      {/* weight + DER */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/5 bg-brand-bgSoft p-4">
          <div className="text-xs text-brand-muted">น้ำหนัก</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-brand-gold">
              {dog.weight_kg ?? '–'}
            </span>
            <span className="text-sm text-brand-muted">กก.</span>
          </div>
          <WeightTrend logs={weightLogs} />
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-brand-bgSoft p-4">
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

      {/* body measurements */}
      <div>
        <div className="mb-2 text-sm font-medium text-brand-cream">
          ขนาดตัว{' '}
          <span className="text-xs font-normal text-brand-muted">· ไว้เลือกไซซ์ตอนช้อป</span>
        </div>
        {hasMeasures ? (
          <div className="grid grid-cols-3 gap-2.5">
            <Measure label="รอบอก" value={dog.chest_cm} />
            <Measure label="รอบคอ" value={dog.neck_cm} />
            <Measure label="รอบปาก" value={dog.muzzle_cm} />
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-white/10 px-3 py-3 text-center text-xs text-brand-muted">
            ยังไม่ได้บันทึกขนาดตัว — เพิ่มได้ที่ “แก้ไขข้อมูลสุขภาพ”
          </p>
        )}
      </div>

      {/* allergies */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/5 bg-brand-bgSoft px-4 py-3">
          <div className="text-xs text-brand-muted">แพ้อาหาร</div>
          <div className="mt-1 text-sm font-medium text-brand-cream">
            {dog.food_allergies || 'ไม่มี / ยังไม่ระบุ'}
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-brand-bgSoft px-4 py-3">
          <div className="text-xs text-brand-muted">แพ้ยา</div>
          <div className="mt-1 text-sm font-medium text-brand-cream">
            {dog.drug_allergies || 'ไม่มี / ยังไม่ระบุ'}
          </div>
        </div>
      </div>

      {/* vaccine timeline */}
      <div>
        <div className="mb-2 text-sm font-medium text-brand-cream">วัคซีน</div>
        {vaccinations.length > 0 ? (
          <ul className="space-y-2">
            {vaccinations.map((v) => (
              <li
                key={v.id}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-brand-bgSoft px-3 py-2.5"
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-green" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-brand-cream">{v.name}</div>
                  <div className="text-xs text-brand-muted">
                    {fmtDate(v.given_on)}
                    {v.clinic ? ` · ${v.clinic}` : ''}
                    {v.next_due_on ? ` · เข็มถัดไป ${fmtDate(v.next_due_on)}` : ''}
                  </div>
                </div>
                <form action={deleteVaccination}>
                  <input type="hidden" name="dogId" value={dog.id} />
                  <input type="hidden" name="vaccId" value={v.id} />
                  <button
                    type="submit"
                    className="text-xs text-brand-muted hover:text-red-300"
                    aria-label="ลบ"
                  >
                    ลบ
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-white/10 px-3 py-3 text-center text-xs text-brand-muted">
            ยังไม่มีประวัติวัคซีน
          </p>
        )}

        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-brand-gold">+ เพิ่มวัคซีน</summary>
          <form action={addVaccination} className="mt-3 space-y-2">
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
          </form>
        </details>
      </div>

      {/* quick weight log */}
      <form action={logWeight} className="flex items-end gap-2">
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
      </form>

      {/* full edit form */}
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
    </section>
  );
}

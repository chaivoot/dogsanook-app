import Link from 'next/link';
import type { DogWithOwners, Profile } from '@/lib/types';
import { dogOwners } from '@/lib/types';
import DogAvatar from '@/components/DogAvatar';
import { addDogOwner, removeDogOwner, updateDogDetails } from '@/app/admin/actions';

export default function DogRow({
  dog,
  owners,
}: {
  dog: DogWithOwners;
  owners: Profile[];
}) {
  const currentOwners = dogOwners(dog);
  const currentIds = new Set(currentOwners.map((o) => o.id));
  const addable = owners.filter((o) => !currentIds.has(o.id));

  return (
    <div className="dark-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <DogAvatar dog={dog} size={44} />
          <div className="min-w-0">
            <p className="truncate font-medium text-brand-cream">{dog.name}</p>
            <p className="truncate text-xs text-brand-muted">
              {dog.breed || 'ไม่ระบุพันธุ์'} ·{' '}
              {currentOwners.length
                ? `เจ้าของ: ${currentOwners
                    .map((o) => o.display_name || o.id.slice(0, 6))
                    .join(', ')}`
                : 'ยังไม่มีเจ้าของ'}
            </p>
          </div>
        </div>
        <Link
          href={`/admin?tab=progress&dog=${dog.id}`}
          className="btn-gold shrink-0 px-4 py-2 text-sm"
        >
          จัดการเกม
        </Link>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-brand-gold">
          เจ้าของ / แก้ไข
        </summary>
        <div className="mt-3 space-y-4">
          {/* Owners (household can share a dog) */}
          <div>
            <label className="label">เจ้าของน้องตัวนี้</label>
            {currentOwners.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-2">
                {currentOwners.map((o) => (
                  <span
                    key={o.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-teal/15 px-3 py-1 text-sm text-brand-teal"
                  >
                    {o.display_name || o.id.slice(0, 6)}
                    <form action={removeDogOwner}>
                      <input type="hidden" name="dogId" value={dog.id} />
                      <input type="hidden" name="ownerId" value={o.id} />
                      <button
                        type="submit"
                        aria-label="เอาออก"
                        className="text-brand-teal/70 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </form>
                  </span>
                ))}
              </div>
            ) : (
              <p className="mb-2 text-xs text-brand-muted">ยังไม่มีเจ้าของ</p>
            )}

            <form action={addDogOwner} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="dogId" value={dog.id} />
              <div className="flex-1">
                <select name="ownerId" defaultValue="" className="input" required>
                  <option value="" disabled>
                    — เลือกคนที่จะเพิ่ม —
                  </option>
                  {addable.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.display_name || o.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-outline">
                + เพิ่มเจ้าของ
              </button>
            </form>
            <p className="mt-1 text-xs text-brand-muted">
              เพิ่มได้หลายคน เช่น พ่อหมา + แม่หมา ช่วยกันดูน้องตัวเดียวกัน
            </p>
          </div>

          {/* Edit details */}
          <form action={updateDogDetails} className="space-y-3 border-t border-white/10 pt-4">
            <input type="hidden" name="dogId" value={dog.id} />
            <div>
              <label className="label">ชื่อน้อง</label>
              <input name="name" defaultValue={dog.name} required className="input" />
            </div>
            <div>
              <label className="label">พันธุ์</label>
              <input name="breed" defaultValue={dog.breed ?? ''} className="input" />
            </div>
            <div>
              <label className="label">โน้ต</label>
              <textarea
                name="notes"
                defaultValue={dog.notes ?? ''}
                rows={2}
                className="input"
              />
            </div>
            <button type="submit" className="btn-gold">
              บันทึก
            </button>
          </form>
        </div>
      </details>
    </div>
  );
}

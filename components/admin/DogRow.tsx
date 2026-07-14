import Link from 'next/link';
import type { Dog, Profile } from '@/lib/types';
import DogAvatar from '@/components/DogAvatar';
import { assignDogOwner, updateDogDetails } from '@/app/admin/actions';

export default function DogRow({
  dog,
  owners,
}: {
  dog: Dog & { owner?: { display_name: string | null } | null };
  owners: Profile[];
}) {
  return (
    <div className="dark-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <DogAvatar dog={dog} size={44} />
          <div className="min-w-0">
            <p className="truncate font-medium text-brand-cream">{dog.name}</p>
            <p className="truncate text-xs text-brand-muted">
              {dog.breed || 'ไม่ระบุพันธุ์'} ·{' '}
              {dog.owner?.display_name
                ? `เจ้าของ: ${dog.owner.display_name}`
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
          แก้ไข / ผูกเจ้าของ
        </summary>
        <div className="mt-3 space-y-4">
          {/* Assign owner */}
          <form action={assignDogOwner} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="dogId" value={dog.id} />
            <div className="flex-1">
              <label className="label">เจ้าของ</label>
              <select
                name="ownerId"
                defaultValue={dog.owner_id ?? ''}
                className="input"
              >
                <option value="">— ไม่มีเจ้าของ —</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.display_name || o.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-outline">
              ผูกเจ้าของ
            </button>
          </form>

          {/* Edit details */}
          <form action={updateDogDetails} className="space-y-3">
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

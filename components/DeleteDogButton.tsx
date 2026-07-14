'use client';

import { deleteDog } from '@/app/dashboard/actions';

/** Delete-dog button with a native confirmation to prevent accidental loss. */
export default function DeleteDogButton({
  dogId,
  dogName,
}: {
  dogId: string;
  dogName: string;
}) {
  return (
    <form
      action={deleteDog}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `ลบน้อง "${dogName}" ออกจากระบบ?\nข้อมูลความคืบหน้า เช็คอิน และรูปทั้งหมดจะถูกลบด้วย และกู้คืนไม่ได้`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="dogId" value={dogId} />
      <button
        type="submit"
        className="rounded-full border border-red-500/40 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
      >
        ลบน้องตัวนี้
      </button>
    </form>
  );
}

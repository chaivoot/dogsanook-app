'use client';

import { deleteDogAsAdmin } from '@/app/admin/actions';

/** Staff delete-dog button with a native confirmation. */
export default function DeleteDogAdminButton({
  dogId,
  dogName,
}: {
  dogId: string;
  dogName: string;
}) {
  return (
    <form
      action={deleteDogAsAdmin}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `ลบน้อง "${dogName}" ออกจากระบบ?\nข้อมูลความคืบหน้า เช็คอิน รูป และการผูกเจ้าของทั้งหมดจะถูกลบด้วย และกู้คืนไม่ได้`,
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

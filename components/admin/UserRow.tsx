import type { Profile } from '@/lib/types';
import { setUserRole, setUserStatus } from '@/app/admin/actions';

const statusStyle: Record<Profile['status'], string> = {
  pending: 'bg-brand-gold/15 text-brand-gold',
  allowed: 'bg-brand-green/15 text-brand-green',
  blocked: 'bg-red-500/15 text-red-300',
};

const statusLabel: Record<Profile['status'], string> = {
  pending: 'รออนุมัติ',
  allowed: 'อนุมัติแล้ว',
  blocked: 'ระงับ',
};

export default function UserRow({
  profile,
  isSelf = false,
}: {
  profile: Profile;
  isSelf?: boolean;
}) {
  return (
    <div className="dark-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-brand-cream">
            {profile.display_name || 'ไม่มีชื่อ'}
          </span>
          {isSelf && (
            <span className="rounded-full bg-brand-teal/20 px-2 py-0.5 text-xs text-brand-teal">
              คุณ
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${statusStyle[profile.status]}`}
          >
            {statusLabel[profile.status]}
          </span>
        </div>
        {profile.line_user_id && (
          <p className="mt-0.5 truncate text-xs text-brand-muted">
            LINE: {profile.line_user_id}
          </p>
        )}
      </div>

      {isSelf ? (
        // No destructive controls on your own account — can't block or demote
        // yourself and get locked out.
        <span className="text-xs text-brand-muted">บัญชีของคุณ</span>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {/* Role select */}
          <form action={setUserRole} className="flex items-center gap-1">
            <input type="hidden" name="profileId" value={profile.id} />
            <select
              name="role"
              defaultValue={profile.role}
              className="rounded-lg border border-white/10 bg-brand-bg px-2 py-1.5 text-sm text-brand-cream"
            >
              <option value="owner">เจ้าของ</option>
              <option value="teacher">ครู</option>
              <option value="admin">แอดมิน</option>
            </select>
            <button type="submit" className="btn-ghost">
              ตั้งบทบาท
            </button>
          </form>

          {/* Block / unblock (signups are auto-approved, so no approval step) */}
          {profile.status === 'blocked' ? (
            <form action={setUserStatus}>
              <input type="hidden" name="profileId" value={profile.id} />
              <input type="hidden" name="status" value="allowed" />
              <button type="submit" className="btn-ghost">
                ปลดระงับ
              </button>
            </form>
          ) : (
            <form action={setUserStatus}>
              <input type="hidden" name="profileId" value={profile.id} />
              <input type="hidden" name="status" value="blocked" />
              <button
                type="submit"
                className="rounded-full border border-red-500/40 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
              >
                ระงับ
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

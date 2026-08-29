import Link from 'next/link';
import Logo from '@/components/Logo';
import DogAvatar from '@/components/DogAvatar';
import SubmitButton from '@/components/SubmitButton';
import { getCurrentProfile } from '@/lib/auth';
import { getInviteWithDog } from '@/lib/data';
import { acceptDogInvite } from '@/app/dashboard/actions';

export const dynamic = 'force-dynamic';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-white/5 bg-brand-bg/90">
        <div className="mx-auto flex max-w-md items-center px-5 py-3">
          <Link href="/">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-md px-5 py-10">{children}</main>
    </div>
  );
}

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { e?: string };
}) {
  const data = await getInviteWithDog(params.token);

  const invalid =
    !data ||
    data.invite.revoked ||
    (data.invite.expires_at && new Date(data.invite.expires_at) < new Date()) ||
    (data.invite.max_uses != null &&
      data.invite.used_count >= data.invite.max_uses);

  if (invalid || !data) {
    return (
      <Shell>
        <div className="dark-card text-center">
          <div className="text-4xl">🔒</div>
          <h1 className="mt-3 text-lg font-bold text-brand-cream">
            ลิงก์คำเชิญนี้ใช้ไม่ได้แล้ว
          </h1>
          <p className="mt-2 text-sm text-brand-muted">
            อาจหมดอายุหรือถูกยกเลิก — ขอลิงก์ใหม่จากเจ้าของน้องได้เลย
          </p>
        </div>
      </Shell>
    );
  }

  const { dog } = data;
  const profile = await getCurrentProfile();

  // Not logged in → send to LINE login, come back to this page after.
  if (!profile) {
    return (
      <Shell>
        <div className="dark-card text-center">
          <DogAvatar dog={dog} size={88} />
          <h1 className="mt-4 text-xl font-bold text-brand-cream">
            คุณได้รับเชิญให้ดูแล {dog.name}
          </h1>
          <p className="mt-2 text-sm text-brand-muted">
            เข้าสู่ระบบด้วย LINE เพื่อรับคำเชิญเป็นเจ้าของร่วม
          </p>
          <Link
            href={`/auth/line/login?next=/invite/${params.token}`}
            className="btn-gold mt-5"
          >
            เข้าสู่ระบบด้วย LINE
          </Link>
        </div>
      </Shell>
    );
  }

  if (profile.status !== 'allowed') {
    return (
      <Shell>
        <div className="dark-card text-center">
          <h1 className="text-lg font-bold text-brand-cream">บัญชียังใช้งานไม่ได้</h1>
          <p className="mt-2 text-sm text-brand-muted">
            บัญชีของคุณถูกระงับ — ติดต่อแอดมินเพื่อขอความช่วยเหลือ
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="dark-card text-center">
        <DogAvatar dog={dog} size={96} />
        <h1 className="mt-4 text-xl font-bold text-brand-cream">
          เข้าร่วมดูแล {dog.name}
        </h1>
        {dog.breed && <p className="text-sm text-brand-muted">{dog.breed}</p>}
        <p className="mt-3 text-sm text-brand-muted">
          รับคำเชิญเพื่อเป็นเจ้าของร่วม — จะเห็นข้อมูลสุขภาพ โภชนาการ
          และการฝึกของน้องได้เต็มที่
        </p>

        {searchParams.e === 'invalid' && (
          <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            ลิงก์นี้ใช้ไม่ได้แล้ว
          </p>
        )}

        <form action={acceptDogInvite} className="mt-5">
          <input type="hidden" name="token" value={params.token} />
          <SubmitButton pendingText="กำลังเข้าร่วม…">
            รับคำเชิญ · เข้าร่วมเป็นเจ้าของร่วม
          </SubmitButton>
        </form>
      </div>
    </Shell>
  );
}

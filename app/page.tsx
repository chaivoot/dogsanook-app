import { redirect } from 'next/navigation';
import Logo from '@/components/Logo';
import LoginButton from '@/components/LoginButton';
import { getCurrentProfile, isStaff } from '@/lib/auth';

function errorMessage(code: string): string {
  switch (code) {
    case 'bad_state':
      return 'เซสชันหมดอายุหรือถูกขัดจังหวะ — กดเข้าสู่ระบบด้วย LINE อีกครั้ง';
    case 'missing_code':
      return 'ไม่ได้รับข้อมูลจาก LINE — ลองใหม่อีกครั้ง';
    case 'line_token_exchange_failed':
      return 'เชื่อมต่อกับ LINE ไม่สำเร็จ — ลองใหม่อีกครั้ง';
    case 'profile_create_failed':
      return 'สร้างบัญชีไม่สำเร็จ — ลองใหม่ หรือแจ้งแอดมิน';
    case 'access_denied':
      return 'คุณยกเลิกการเข้าสู่ระบบ';
    default:
      return 'เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง';
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  // Already signed in → route to the right place.
  const profile = await getCurrentProfile();
  if (profile) {
    if (profile.status === 'pending') redirect('/pending');
    if (profile.status === 'blocked') redirect('/blocked');
    redirect(isStaff(profile) ? '/admin' : '/dashboard');
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-12">
      <div className="w-full text-center">
        <Logo size={128} className="mx-auto shadow-card" />

        <h1 className="mt-8 text-2xl font-bold text-brand-cream">
          ระบบติดตามการเรียนของน้องหมา
        </h1>
        <p className="mt-3 leading-relaxed text-brand-muted">
          เข้าสู่ระบบเพื่อดูความคืบหน้าคอร์สฝึก 10 เกมของน้อง
          พร้อมเช็คอินการบ้านและรูปการฝึกทุกคาบ
        </p>

        {searchParams?.error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <p>{errorMessage(searchParams.error)}</p>
            <p className="mt-1 text-xs text-red-200/60">
              รหัส: {searchParams.error}
            </p>
          </div>
        )}

        <div className="mt-8">
          <LoginButton />
        </div>

        <p className="mt-6 text-xs leading-relaxed text-brand-muted/70">
          หลังเข้าสู่ระบบครั้งแรก บัญชีจะรอให้ครูอนุมัติก่อนใช้งาน
        </p>
      </div>

      <footer className="mt-16 text-center text-xs text-brand-muted/60">
        หมาสนุก · ฝึกหมาสไตล์เล่นไปฝึกไป ไม่ดุ ไม่บังคับ
      </footer>
    </main>
  );
}

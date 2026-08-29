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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
      <div className="flex flex-1 flex-col justify-center">
        <div className="text-center">
          <Logo size={112} className="mx-auto shadow-card" />
          <h1 className="mt-6 text-2xl font-bold text-brand-cream">
            สมุดสุขภาพน้องหมา ครบในที่เดียว
          </h1>
          <p className="mt-3 leading-relaxed text-brand-muted">
            บันทึกสุขภาพ คำนวณพลังงาน (DER) แนะนำอาหาร ดูกราฟพัฒนาการ
            และติดตามการฝึก — โดยหมาสนุก × dogevityfood
          </p>
        </div>

        {/* value highlights */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Feature
            title="สมุดสุขภาพ"
            desc="วัคซีน ขนาดตัว อาการแพ้"
            color="#7ab648"
            icon={
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
            }
          />
          <Feature
            title="โภชนาการ"
            desc="คำนวณ DER + แนะนำอาหาร"
            color="#ffcb05"
            icon={
              <path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2M5 2v20M16 2c-1.5 1-2.5 3-2.5 6s1 5 2.5 6v8" />
            }
          />
          <Feature
            title="กราฟพัฒนาการ"
            desc="น้ำหนัก · สุขภาพ"
            color="#00848e"
            icon={
              <>
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </>
            }
          />
          <Feature
            title="ฝึก 10 เกม"
            desc="เล่นไปฝึกไป ไม่ดุ"
            color="#3b82f6"
            icon={
              <>
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="4" />
              </>
            }
          />
        </div>

        {searchParams?.error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <p>{errorMessage(searchParams.error)}</p>
            <p className="mt-1 text-xs text-red-200/60">รหัส: {searchParams.error}</p>
          </div>
        )}
      </div>

      <div className="pt-8">
        <LoginButton />
        <p className="mt-3 text-center text-xs text-brand-muted/70">
          กด LINE ทีเดียวเริ่มใช้ได้เลย ฟรี
        </p>
        <footer className="mt-8 text-center text-xs text-brand-muted/60">
          หมาสนุก · ฝึกหมาสไตล์เล่นไปฝึกไป ไม่ดุ ไม่บังคับ
        </footer>
      </div>
    </main>
  );
}

function Feature({
  title,
  desc,
  color,
  icon,
}: {
  title: string;
  desc: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-white/5 bg-brand-bgSoft p-4">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: `${color}22` }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {icon}
        </svg>
      </div>
      <div className="mt-2 text-sm font-semibold text-brand-cream">{title}</div>
      <div className="text-xs text-brand-muted">{desc}</div>
    </div>
  );
}

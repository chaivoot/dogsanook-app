import Logo from '@/components/Logo';
import LoginButton from '@/components/LoginButton';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-12">
      <div className="w-full text-center">
        <Logo className="text-2xl" />

        <div className="mt-10 text-6xl">🐕</div>

        <h1 className="mt-6 text-2xl font-bold text-brand-cream">
          ระบบติดตามการเรียนของน้องหมา
        </h1>
        <p className="mt-3 leading-relaxed text-brand-muted">
          เข้าสู่ระบบเพื่อดูความคืบหน้าคอร์สฝึก 10 เกมของน้อง
          พร้อมเช็คอินการบ้านและรูปการฝึกทุกคาบ
        </p>

        {searchParams?.error && (
          <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง
          </p>
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

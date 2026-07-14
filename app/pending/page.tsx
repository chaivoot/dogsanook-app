import Logo from '@/components/Logo';
import SignOutButton from '@/components/SignOutButton';
import { getCurrentProfile } from '@/lib/auth';

export default async function PendingPage() {
  const profile = await getCurrentProfile();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-12 text-center">
      <Logo size={72} className="mx-auto" />

      <div className="mt-8 text-6xl">⏳</div>

      <h1 className="mt-6 text-2xl font-bold text-brand-cream">รออนุมัติ</h1>
      <p className="mt-3 leading-relaxed text-brand-muted">
        สวัสดี{profile?.display_name ? ` คุณ${profile.display_name}` : ''} 👋
        <br />
        บัญชีของคุณกำลังรอครูอนุมัติ เมื่ออนุมัติแล้วจะเข้าดูความคืบหน้าของน้องได้ทันที
      </p>

      <div className="mt-8 w-full rounded-card border border-white/5 bg-brand-bgSoft p-5 text-left text-sm text-brand-muted">
        <p className="font-medium text-brand-cream">ระหว่างรอ ทักครูได้เลย</p>
        <p className="mt-1 leading-relaxed">
          แจ้งชื่อของคุณและชื่อน้องหมาให้ครูทาง LINE เพื่อให้ครูผูกน้องเข้ากับบัญชีของคุณได้ถูกต้อง
        </p>
      </div>

      <div className="mt-8">
        <SignOutButton />
      </div>
    </main>
  );
}

import Logo from '@/components/Logo';
import SignOutButton from '@/components/SignOutButton';

export default function BlockedPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-12 text-center">
      <Logo size={72} className="mx-auto" />

      <div className="mt-8 text-6xl">🚫</div>

      <h1 className="mt-6 text-2xl font-bold text-brand-cream">
        บัญชีถูกระงับการใช้งาน
      </h1>
      <p className="mt-3 leading-relaxed text-brand-muted">
        หากคิดว่าเป็นความผิดพลาด กรุณาติดต่อครูทาง LINE
      </p>

      <div className="mt-8">
        <SignOutButton />
      </div>
    </main>
  );
}

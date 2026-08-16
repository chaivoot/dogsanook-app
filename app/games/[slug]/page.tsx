import Link from 'next/link';
import { notFound } from 'next/navigation';
import Logo from '@/components/Logo';
import AppHeader from '@/components/AppHeader';
import Markdown from '@/components/Markdown';
import { getCurrentProfile, isStaff } from '@/lib/auth';
import { getLessonBySlug } from '@/lib/data';

// Public page — anyone can read the guides.
export const dynamic = 'force-dynamic';

export default async function GameGuidePage({
  params,
}: {
  params: { slug: string };
}) {
  const lesson = await getLessonBySlug(params.slug);
  if (!lesson) notFound();

  const profile = await getCurrentProfile();
  const num = String(lesson.id).padStart(2, '0');
  const backHref = profile ? (isStaff(profile) ? '/admin' : '/dashboard') : '/';

  return (
    <div className="min-h-dvh">
      {profile ? (
        <AppHeader profile={profile} />
      ) : (
        <header className="sticky top-0 z-10 border-b border-white/5 bg-brand-bg/90 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3">
            <Link href="/">
              <Logo />
            </Link>
            <Link href="/" className="btn-ghost">
              เข้าสู่ระบบ
            </Link>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-2xl px-5 py-6">
        <Link href={backHref} className="text-sm text-brand-gold">
          ← กลับ
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-2xl font-bold text-brand-gold">{num}</span>
          <h1 className="text-2xl font-bold text-brand-cream">
            {lesson.name_th}
          </h1>
        </div>

        {lesson.summary && (
          <p className="mt-2 leading-relaxed text-brand-muted">
            {lesson.summary}
          </p>
        )}

        <div className="mt-6">
          {lesson.content ? (
            <Markdown>{lesson.content}</Markdown>
          ) : (
            <p className="rounded-card border border-dashed border-white/10 px-4 py-10 text-center text-sm text-brand-muted">
              ยังไม่มีเนื้อหาคู่มือสำหรับเกมนี้
              {isStaff(profile) && ' · เพิ่มได้ที่แผงครู → แท็บคู่มือ'}
            </p>
          )}
        </div>

        {!profile && (
          <div className="mt-10 rounded-card border border-brand-teal/25 bg-brand-teal/10 px-5 py-4 text-center">
            <p className="font-medium text-brand-cream">
              อยากให้น้องเรียนกับครูหมาสนุกไหม? 🐕
            </p>
            <p className="mt-1 text-sm text-brand-muted">
              หัวใจอยู่ที่การสอนหน้างาน — เข้าสู่ระบบเพื่อติดตามพัฒนาการน้อง
            </p>
            <Link href="/" className="btn-gold mt-4">
              เข้าสู่ระบบด้วย LINE
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireProfile, isStaff } from '@/lib/auth';
import { getLessonBySlug } from '@/lib/data';
import AppHeader from '@/components/AppHeader';
import Markdown from '@/components/Markdown';

export default async function GameGuidePage({
  params,
}: {
  params: { slug: string };
}) {
  const profile = await requireProfile();
  const lesson = await getLessonBySlug(params.slug);
  if (!lesson) notFound();

  const num = String(lesson.id).padStart(2, '0');

  return (
    <div className="min-h-dvh">
      <AppHeader profile={profile} />

      <main className="mx-auto max-w-2xl px-5 py-6">
        <Link
          href={isStaff(profile) ? '/admin' : '/dashboard'}
          className="text-sm text-brand-gold"
        >
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
      </main>
    </div>
  );
}

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/auth';
import { getDogById, getDogProgress } from '@/lib/data';
import AppHeader from '@/components/AppHeader';
import DogAvatar from '@/components/DogAvatar';
import ProgressSummary from '@/components/games/ProgressSummary';
import Legend from '@/components/games/Legend';
import OwnerGameCard from '@/components/games/OwnerGameCard';
import PhotoGallery from '@/components/games/PhotoGallery';

/** Staff-only read-only preview of how an owner sees a dog's dashboard. */
export default async function OwnerPreviewPage({
  params,
}: {
  params: { dogId: string };
}) {
  const profile = await requireStaff();
  const dog = await getDogById(params.dogId);
  if (!dog) notFound();

  const { lessons, photos } = await getDogProgress(dog.id);
  const lessonList = lessons.map((l) => l.lesson);

  return (
    <div className="min-h-dvh">
      <AppHeader profile={profile} />

      <main className="mx-auto max-w-2xl px-5 py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href={`/admin?tab=progress&dog=${dog.id}`}
            className="text-sm text-brand-gold"
          >
            ← กลับไปจัดการเกม
          </Link>
        </div>

        {/* Preview banner */}
        <div className="mb-5 rounded-card border border-brand-teal/30 bg-brand-teal/10 px-4 py-3 text-sm text-brand-cream">
          👁 กำลังดู <span className="font-semibold">มุมมองเจ้าของ</span>{' '}
          (พรีวิว) — ปุ่มเช็คอินถูกซ่อนไว้ นี่คือหน้าที่เจ้าของของ{' '}
          <span className="font-semibold">{dog.name}</span> เห็น
        </div>

        <div className="space-y-6">
          <section className="dark-card">
            <div className="flex items-center gap-4">
              <DogAvatar dog={dog} size={72} />
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold text-brand-cream">
                  {dog.name}
                </h1>
                {dog.breed && (
                  <p className="text-sm text-brand-muted">{dog.breed}</p>
                )}
              </div>
            </div>
            {dog.notes && (
              <p className="mt-3 rounded-xl bg-brand-bg/60 px-3 py-2 text-sm text-brand-muted">
                {dog.notes}
              </p>
            )}
          </section>

          <ProgressSummary lessons={lessons} />

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-brand-gold">
              ระบบติดตามการเรียนสุนัข 10 เกม
            </h2>
            <Legend />
            <div className="mt-3 space-y-3">
              {lessons.map((view) => (
                <OwnerGameCard
                  key={view.lesson.id}
                  dogId={dog.id}
                  view={view}
                  readOnly
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-brand-cream">
              บันทึกภาพทุกครั้งที่ฝึก
            </h2>
            <PhotoGallery photos={photos} lessons={lessonList} />
          </section>
        </div>
      </main>
    </div>
  );
}

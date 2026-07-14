import Link from 'next/link';
import { requireProfile } from '@/lib/auth';
import { getDogsForOwner, getDogProgress } from '@/lib/data';
import AppHeader from '@/components/AppHeader';
import DogAvatar from '@/components/DogAvatar';
import ProgressSummary from '@/components/games/ProgressSummary';
import Legend from '@/components/games/Legend';
import OwnerGameCard from '@/components/games/OwnerGameCard';
import PhotoGallery from '@/components/games/PhotoGallery';
import DeleteDogButton from '@/components/DeleteDogButton';
import { addDog, updateDog, updateDogPhoto } from './actions';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { dog?: string };
}) {
  const profile = await requireProfile();
  const dogs = await getDogsForOwner(profile.id);

  const activeDog =
    dogs.find((d) => d.id === searchParams.dog) ?? dogs[0] ?? null;

  return (
    <div className="min-h-dvh">
      <AppHeader profile={profile} />

      <main className="mx-auto max-w-2xl px-5 py-6">
        {dogs.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Dog switcher */}
            {dogs.length > 1 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {dogs.map((dog) => (
                  <Link
                    key={dog.id}
                    href={`/dashboard?dog=${dog.id}`}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                      dog.id === activeDog?.id
                        ? 'border-brand-gold bg-brand-gold/15 text-brand-gold'
                        : 'border-white/10 text-brand-muted hover:bg-white/5'
                    }`}
                  >
                    <DogAvatar dog={dog} size={24} />
                    {dog.name}
                  </Link>
                ))}
              </div>
            )}

            {activeDog && <DogSection dog={activeDog} />}
          </>
        )}

        {/* Add another dog */}
        <details className="mt-8 dark-card">
          <summary className="cursor-pointer font-medium text-brand-cream">
            + เพิ่มน้องหมา
          </summary>
          <form action={addDog} className="mt-4 space-y-3">
            <div>
              <label className="label">ชื่อน้อง</label>
              <input name="name" required className="input" placeholder="เช่น มอมแมม" />
            </div>
            <div>
              <label className="label">พันธุ์ (ไม่บังคับ)</label>
              <input name="breed" className="input" placeholder="เช่น Shetland Sheepdog" />
            </div>
            <button type="submit" className="btn-gold">
              เพิ่มน้อง
            </button>
          </form>
        </details>
      </main>
    </div>
  );
}

async function DogSection({
  dog,
}: {
  dog: Awaited<ReturnType<typeof getDogsForOwner>>[number];
}) {
  const { lessons, photos } = await getDogProgress(dog.id);
  const lessonList = lessons.map((l) => l.lesson);

  return (
    <div className="space-y-6">
      {/* Dog header */}
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

        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-brand-gold">
            แก้ไขรายละเอียดน้อง
          </summary>
          <div className="mt-3 space-y-4">
            <form action={updateDog} className="space-y-3">
              <input type="hidden" name="dogId" value={dog.id} />
              <div>
                <label className="label">ชื่อน้อง</label>
                <input name="name" defaultValue={dog.name} required className="input" />
              </div>
              <div>
                <label className="label">พันธุ์</label>
                <input name="breed" defaultValue={dog.breed ?? ''} className="input" />
              </div>
              <div>
                <label className="label">โน้ต</label>
                <textarea
                  name="notes"
                  defaultValue={dog.notes ?? ''}
                  rows={2}
                  className="input"
                />
              </div>
              <button type="submit" className="btn-gold">
                บันทึก
              </button>
            </form>

            <form action={updateDogPhoto} className="space-y-2">
              <input type="hidden" name="dogId" value={dog.id} />
              <label className="label">รูปน้อง</label>
              <input
                type="file"
                name="photo"
                accept="image/*"
                className="block w-full text-sm text-brand-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand-gold file:px-4 file:py-2 file:font-semibold file:text-brand-ink"
              />
              <button type="submit" className="btn-outline mt-2">
                อัปโหลดรูป
              </button>
            </form>

            <div className="border-t border-white/10 pt-4">
              <p className="mb-2 text-xs text-brand-muted">โซนอันตราย</p>
              <DeleteDogButton dogId={dog.id} dogName={dog.name} />
            </div>
          </div>
        </details>
      </section>

      <ProgressSummary lessons={lessons} />

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-brand-gold">
          ระบบติดตามการเรียนสุนัข 10 เกม
        </h2>
        <Legend />
        <div className="mt-3 space-y-3">
          {lessons.map((view) => (
            <OwnerGameCard key={view.lesson.id} dogId={dog.id} view={view} />
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
  );
}

function EmptyState() {
  return (
    <div className="dark-card text-center">
      <div className="text-5xl">🐾</div>
      <h1 className="mt-4 text-xl font-bold text-brand-cream">
        ยังไม่มีน้องหมาในบัญชี
      </h1>
      <p className="mt-2 text-sm text-brand-muted">
        เพิ่มน้องของคุณด้านล่าง หรือรอครูผูกน้องเข้ากับบัญชีให้
      </p>
    </div>
  );
}

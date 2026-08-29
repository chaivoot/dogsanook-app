import Link from 'next/link';
import type { Dog } from '@/lib/types';
import { requireProfile } from '@/lib/auth';
import {
  getDogsForOwner,
  getDogProgress,
  getWeightLogs,
  getVaccinations,
} from '@/lib/data';
import AppHeader from '@/components/AppHeader';
import HealthPassport from '@/components/health/HealthPassport';
import FoodRecommendation from '@/components/health/FoodRecommendation';
import SubmitButton from '@/components/SubmitButton';
import ProfilePhotoUploader from '@/components/ProfilePhotoUploader';
import DogAvatar from '@/components/DogAvatar';
import ProgressSummary from '@/components/games/ProgressSummary';
import Legend from '@/components/games/Legend';
import OwnerGameCard from '@/components/games/OwnerGameCard';
import PhotoGallery from '@/components/games/PhotoGallery';
import DeleteDogButton from '@/components/DeleteDogButton';
import { addDog, updateDog, setMediaConsent } from './actions';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { dog?: string; mc?: string; health?: string };
}) {
  const profile = await requireProfile();
  const dogs = await getDogsForOwner(profile.id);

  const activeDog =
    dogs.find((d) => d.id === searchParams.dog) ?? dogs[0] ?? null;

  return (
    <div className="min-h-dvh">
      <AppHeader profile={profile} />

      <main className="mx-auto max-w-2xl px-5 py-6">
        {searchParams.mc === 'ok' && (
          <p className="mb-4 rounded-xl border border-brand-green/25 bg-brand-green/10 px-4 py-2.5 text-sm text-brand-green">
            ✓ บันทึกการยินยอมเรียบร้อยแล้ว
          </p>
        )}
        {searchParams.mc === 'err' && (
          <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
            บันทึกไม่สำเร็จ (เกิดข้อผิดพลาดฝั่งฐานข้อมูล) — ลองใหม่หรือแจ้งแอดมิน
          </p>
        )}
        {searchParams.mc === 'auth' && (
          <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
            ไม่มีสิทธิ์บันทึกการยินยอมสำหรับน้องตัวนี้
          </p>
        )}
        {searchParams.health === 'ok' && (
          <p className="mb-4 rounded-xl border border-brand-green/25 bg-brand-green/10 px-4 py-2.5 text-sm text-brand-green">
            ✓ บันทึกข้อมูลสุขภาพเรียบร้อยแล้ว
          </p>
        )}
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

            {activeDog && <DogSection dog={activeDog} ownerId={profile.id} />}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">เพศ</label>
                <select name="sex" defaultValue="" className="input">
                  <option value="">— ไม่ระบุ —</option>
                  <option value="male">ผู้</option>
                  <option value="female">เมีย</option>
                </select>
              </div>
              <div>
                <label className="label">วันเกิด</label>
                <input type="date" name="birthdate" className="input" />
              </div>
            </div>
            <div>
              <label className="label">น้ำหนัก (กก.) — ไว้คำนวณ DER</label>
              <input
                name="weight_kg"
                type="number"
                step="0.1"
                min="0"
                className="input"
                placeholder="เช่น 12.4"
              />
            </div>
            <div>
              <label className="label">รูปน้อง (ไม่บังคับ)</label>
              <input
                type="file"
                name="photo"
                accept="image/*"
                className="block w-full text-sm text-brand-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand-gold file:px-4 file:py-2 file:font-semibold file:text-brand-ink"
              />
            </div>
            <SubmitButton pendingText="กำลังเพิ่ม…">เพิ่มน้อง</SubmitButton>
          </form>
        </details>
      </main>
    </div>
  );
}

async function DogSection({
  dog,
  ownerId,
}: {
  dog: Awaited<ReturnType<typeof getDogsForOwner>>[number];
  ownerId: string;
}) {
  const [{ lessons, photos }, weightLogs, vaccinations] = await Promise.all([
    getDogProgress(dog.id),
    getWeightLogs(dog.id),
    getVaccinations(dog.id),
  ]);
  const lessonList = lessons.map((l) => l.lesson);

  // Group media by game; keep uncategorized (no lesson) separate.
  const photosByLesson = new Map<number, typeof photos>();
  const otherPhotos: typeof photos = [];
  for (const p of photos) {
    if (p.lesson_id == null) {
      otherPhotos.push(p);
    } else {
      const arr = photosByLesson.get(p.lesson_id) ?? [];
      arr.push(p);
      photosByLesson.set(p.lesson_id, arr);
    }
  }

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
              <SubmitButton>บันทึก</SubmitButton>
            </form>

            <div className="space-y-2">
              <label className="label">รูปน้อง</label>
              <ProfilePhotoUploader dogId={dog.id} />
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="mb-2 text-xs text-brand-muted">โซนอันตราย</p>
              <DeleteDogButton dogId={dog.id} dogName={dog.name} />
            </div>
          </div>
        </details>
      </section>

      <HealthPassport
        dog={dog}
        weightLogs={weightLogs}
        vaccinations={vaccinations}
      />

      <FoodRecommendation dog={dog} />

      <MediaConsentCard dog={dog} />

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
              photos={photosByLesson.get(view.lesson.id) ?? []}
              ownerId={ownerId}
            />
          ))}
        </div>
      </section>

      {otherPhotos.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-brand-cream">
            รูป/วิดีโออื่นๆ
          </h2>
          <PhotoGallery
            photos={otherPhotos}
            lessons={lessonList}
            deletableFor={ownerId}
          />
        </section>
      )}
    </div>
  );
}

function MediaConsentCard({ dog }: { dog: Dog }) {
  // Once consented, the prompt disappears — no need to keep nudging.
  if (dog.media_consent) return null;

  return (
    <section className="dark-card">
      <p className="font-medium text-brand-cream">
        📸 อนุญาตให้ครูบันทึกภาพ/วิดีโอ
      </p>
      <p className="mt-1 leading-relaxed text-sm text-brand-muted">
        ระหว่างฝึก ครูอยากถ่ายรูป/คลิปของ{dog.name}
        เพื่อบันทึกความคืบหน้าและส่งให้คุณดู กดยินยอมเพื่อให้ครูถ่ายและแชร์ให้คุณได้
      </p>
      <form action={setMediaConsent} className="mt-3">
        <input type="hidden" name="dogId" value={dog.id} />
        <input type="hidden" name="consent" value="true" />
        <SubmitButton pendingText="กำลังบันทึก…">ยินยอม ✓</SubmitButton>
      </form>
    </section>
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

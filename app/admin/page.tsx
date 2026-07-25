import Link from 'next/link';
import { requireProfile, isStaff } from '@/lib/auth';
import {
  getAllProfiles,
  getAllDogs,
  getDogProgress,
  getLessons,
  getCampaignsWithCounts,
  getClaims,
} from '@/lib/data';
import { dogOwners } from '@/lib/types';
import AppHeader from '@/components/AppHeader';
import DogAvatar from '@/components/DogAvatar';
import UserRow from '@/components/admin/UserRow';
import DogRow from '@/components/admin/DogRow';
import AdminGameCard from '@/components/games/AdminGameCard';
import {
  createDog,
  uploadSessionPhoto,
  deleteSessionPhoto,
  updateLessonContent,
  createCampaign,
  toggleCampaign,
  setClaimStatus,
} from './actions';
import { redirect } from 'next/navigation';

type Tab = 'users' | 'dogs' | 'guides' | 'vouchers' | 'progress';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { tab?: Tab; dog?: string };
}) {
  const profile = await requireProfile();
  if (!isStaff(profile)) redirect('/dashboard');

  const tab: Tab = searchParams.tab ?? 'users';
  const [profiles, dogs] = await Promise.all([
    getAllProfiles(),
    getAllDogs(),
  ]);
  const owners = profiles.filter((p) => p.status !== 'blocked');
  const pendingCount = profiles.filter((p) => p.status === 'pending').length;

  return (
    <div className="min-h-dvh">
      <AppHeader profile={profile} />

      <main className="mx-auto max-w-2xl px-5 py-6">
        <h1 className="mb-4 text-2xl font-bold text-brand-cream">แผงครู</h1>

        {/* Tabs */}
        <nav className="mb-6 flex flex-wrap gap-2">
          <TabLink tab="users" current={tab} label="ผู้ใช้" badge={pendingCount} />
          <TabLink tab="dogs" current={tab} label="น้องหมา" />
          <TabLink tab="guides" current={tab} label="คู่มือ" />
          <TabLink tab="vouchers" current={tab} label="Voucher" />
        </nav>

        {tab === 'users' && (
          <section className="space-y-3">
            {profiles.length === 0 ? (
              <p className="text-sm text-brand-muted">ยังไม่มีผู้ใช้</p>
            ) : (
              profiles.map((p) => (
                <UserRow key={p.id} profile={p} isSelf={p.id === profile.id} />
              ))
            )}
          </section>
        )}

        {tab === 'dogs' && (
          <section className="space-y-4">
            {/* Create dog */}
            <details className="dark-card">
              <summary className="cursor-pointer font-medium text-brand-cream">
                + เพิ่มน้องหมาใหม่
              </summary>
              <form action={createDog} className="mt-4 space-y-3">
                <div>
                  <label className="label">ชื่อน้อง</label>
                  <input name="name" required className="input" />
                </div>
                <div>
                  <label className="label">พันธุ์</label>
                  <input name="breed" className="input" />
                </div>
                <div>
                  <label className="label">เจ้าของ</label>
                  <select name="ownerId" className="input" defaultValue="">
                    <option value="">— ยังไม่ผูกเจ้าของ —</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.display_name || o.id.slice(0, 8)}
                      </option>
                    ))}
                  </select>
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
                <button type="submit" className="btn-gold">
                  เพิ่มน้อง
                </button>
              </form>
            </details>

            {dogs.length === 0 ? (
              <p className="text-sm text-brand-muted">ยังไม่มีน้องหมา</p>
            ) : (
              dogs.map((dog) => (
                <DogRow key={dog.id} dog={dog} owners={owners} />
              ))
            )}
          </section>
        )}

        {tab === 'guides' && <GuidesEditor />}

        {tab === 'vouchers' && <VoucherManager />}

        {tab === 'progress' && searchParams.dog && (
          <ProgressManager dogId={searchParams.dog} />
        )}
      </main>
    </div>
  );
}

function TabLink({
  tab,
  current,
  label,
  badge,
}: {
  tab: Tab;
  current: Tab;
  label: string;
  badge?: number;
}) {
  const active = tab === current;
  return (
    <Link
      href={`/admin?tab=${tab}`}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? 'bg-brand-gold text-brand-ink'
          : 'border border-white/10 text-brand-muted hover:bg-white/5'
      }`}
    >
      {label}
      {badge ? (
        <span className="rounded-full bg-red-500 px-1.5 text-xs text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

async function GuidesEditor() {
  const lessons = await getLessons();
  return (
    <section className="space-y-3">
      <p className="text-sm text-brand-muted">
        ใส่/แก้เนื้อหาคู่มือแต่ละเกม (รองรับ Markdown เช่น **ตัวหนา**, - รายการ)
        เจ้าของจะกดดูได้จากการ์ดเกมในหน้าของตัวเอง
      </p>
      {lessons.map((lesson) => {
        const num = String(lesson.id).padStart(2, '0');
        const filled = !!lesson.content;
        return (
          <details key={lesson.id} className="dark-card">
            <summary className="flex cursor-pointer items-center justify-between gap-2">
              <span className="font-medium text-brand-cream">
                <span className="text-brand-gold">{num}</span> {lesson.name_th}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  filled
                    ? 'bg-brand-green/15 text-brand-green'
                    : 'bg-white/5 text-brand-muted'
                }`}
              >
                {filled ? 'มีเนื้อหา' : 'ว่าง'}
              </span>
            </summary>

            <form action={updateLessonContent} className="mt-4 space-y-3">
              <input type="hidden" name="lessonId" value={lesson.id} />
              <div>
                <label className="label">สรุปสั้นๆ (ไม่บังคับ)</label>
                <input
                  name="summary"
                  defaultValue={lesson.summary ?? ''}
                  className="input"
                  placeholder="1 บรรทัดอธิบายเกมนี้"
                />
              </div>
              <div>
                <label className="label">เนื้อหาคู่มือ (Markdown)</label>
                <textarea
                  name="content"
                  defaultValue={lesson.content ?? ''}
                  rows={10}
                  className="input font-mono text-sm"
                  placeholder="วางเนื้อหาจากคู่มือได้เลย…"
                />
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" className="btn-gold">
                  บันทึก
                </button>
                {lesson.slug && (
                  <Link
                    href={`/games/${lesson.slug}`}
                    className="text-sm text-brand-teal hover:underline"
                  >
                    เปิดหน้าคู่มือ →
                  </Link>
                )}
              </div>
            </form>
          </details>
        );
      })}
    </section>
  );
}

const CLAIM_STATUS: { value: string; label: string; cls: string }[] = [
  { value: 'new', label: 'ใหม่', cls: 'bg-brand-gold/15 text-brand-gold' },
  { value: 'contacted', label: 'ติดต่อแล้ว', cls: 'bg-brand-blue/15 text-brand-blue' },
  { value: 'attended', label: 'มาเรียนแล้ว', cls: 'bg-brand-green/15 text-brand-green' },
  { value: 'expired', label: 'หมดอายุ', cls: 'bg-white/10 text-brand-muted' },
];

async function VoucherManager() {
  const [campaigns, claims] = await Promise.all([
    getCampaignsWithCounts(),
    getClaims(),
  ]);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://app.dogsanook.com';

  return (
    <div className="space-y-6">
      {/* Create campaign */}
      <details className="dark-card">
        <summary className="cursor-pointer font-medium text-brand-cream">
          + สร้างแคมเปญใหม่
        </summary>
        <form action={createCampaign} className="mt-4 space-y-3">
          <div>
            <label className="label">ชื่อแคมเปญ *</label>
            <input name="name" required className="input" placeholder="เช่น ทดลองเรียนฟรี 1 คาบ" />
          </div>
          <div>
            <label className="label">ลิงก์ (slug) *</label>
            <input
              name="slug"
              required
              className="input"
              placeholder="เช่น free-trial-vetabc (a-z, 0-9, -)"
            />
            <p className="mt-1 text-xs text-brand-muted">
              จะได้ลิงก์ {appUrl}/claim/<span className="text-brand-gold">slug</span>
            </p>
          </div>
          <div>
            <label className="label">พาร์ทเนอร์ (ไม่บังคับ)</label>
            <input
              name="partner"
              className="input"
              placeholder="เช่น รพส. / งานอีเวนต์ / ฟาร์มที่รับน้องมา"
            />
          </div>
          <div>
            <label className="label">คำอธิบาย (โชว์บนหน้าเคลม)</label>
            <textarea name="description" rows={2} className="input" />
          </div>
          <div>
            <label className="label">จำกัดจำนวนสิทธิ์ (เว้นว่าง = ไม่จำกัด)</label>
            <input name="max_claims" inputMode="numeric" className="input" placeholder="เช่น 50" />
          </div>
          <button type="submit" className="btn-gold">
            สร้างแคมเปญ
          </button>
        </form>
      </details>

      {/* Campaign list */}
      <section className="space-y-3">
        <h3 className="text-lg font-bold text-brand-cream">แคมเปญ</h3>
        {campaigns.length === 0 ? (
          <p className="text-sm text-brand-muted">ยังไม่มีแคมเปญ</p>
        ) : (
          campaigns.map((c) => (
            <div key={c.id} className="dark-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-brand-cream">
                    {c.name}{' '}
                    <span
                      className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                        c.active
                          ? 'bg-brand-green/15 text-brand-green'
                          : 'bg-white/10 text-brand-muted'
                      }`}
                    >
                      {c.active ? 'เปิดรับ' : 'ปิด'}
                    </span>
                  </p>
                  {c.partner && (
                    <p className="text-xs text-brand-muted">ร่วมกับ {c.partner}</p>
                  )}
                  <p className="mt-1 break-all text-xs text-brand-gold">
                    {appUrl}/claim/{c.slug}
                  </p>
                  <p className="mt-1 text-xs text-brand-muted">
                    เคลมแล้ว {c.claim_count}
                    {c.max_claims != null ? ` / ${c.max_claims}` : ''} สิทธิ์
                  </p>
                </div>
                <form action={toggleCampaign}>
                  <input type="hidden" name="campaignId" value={c.id} />
                  <input type="hidden" name="active" value={(!c.active).toString()} />
                  <button type="submit" className="btn-ghost">
                    {c.active ? 'ปิดรับ' : 'เปิดรับ'}
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Claims list */}
      <section className="space-y-3">
        <h3 className="text-lg font-bold text-brand-cream">
          รายการเคลม ({claims.length})
        </h3>
        {claims.length === 0 ? (
          <p className="text-sm text-brand-muted">ยังไม่มีคนเคลม</p>
        ) : (
          claims.map((claim) => (
            <div key={claim.id} className="dark-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-brand-cream">
                    {claim.dog?.name ?? 'ไม่ระบุน้อง'}
                    {claim.dog?.breed ? ` · ${claim.dog.breed}` : ''}
                  </p>
                  <p className="text-xs text-brand-muted">
                    โดย {claim.profile?.display_name ?? '—'} ·{' '}
                    {claim.campaign?.name ?? ''}
                  </p>
                  {claim.contact && (
                    <p className="text-xs text-brand-muted">ติดต่อ: {claim.contact}</p>
                  )}
                  <p className="mt-1 font-mono text-sm text-brand-gold">
                    {claim.code}
                  </p>
                </div>
                <form action={setClaimStatus} className="flex items-center gap-1">
                  <input type="hidden" name="claimId" value={claim.id} />
                  <select
                    name="status"
                    defaultValue={claim.status}
                    className="rounded-lg border border-white/10 bg-brand-bg px-2 py-1.5 text-sm text-brand-cream"
                  >
                    {CLAIM_STATUS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="btn-ghost">
                    อัปเดต
                  </button>
                </form>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

async function ProgressManager({ dogId }: { dogId: string }) {
  const dogs = await getAllDogs();
  const dog = dogs.find((d) => d.id === dogId);
  if (!dog) {
    return (
      <p className="text-sm text-brand-muted">
        ไม่พบน้องหมา ·{' '}
        <Link href="/admin?tab=dogs" className="text-brand-gold">
          กลับไปรายการน้อง
        </Link>
      </p>
    );
  }

  const { lessons, photos } = await getDogProgress(dogId);
  const lessonList = lessons.map((l) => l.lesson);

  return (
    <div className="space-y-6">
      <Link href="/admin?tab=dogs" className="text-sm text-brand-gold">
        ← กลับไปรายการน้อง
      </Link>

      <section className="dark-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <DogAvatar dog={dog} size={64} />
          <div>
            <h2 className="text-xl font-bold text-brand-cream">{dog.name}</h2>
            <p className="text-sm text-brand-muted">
              {dog.breed || 'ไม่ระบุพันธุ์'} ·{' '}
              {dogOwners(dog).length
                ? dogOwners(dog)
                    .map((o) => o.display_name || o.id.slice(0, 6))
                    .join(', ')
                : 'ยังไม่มีเจ้าของ'}
            </p>
          </div>
        </div>
        <Link
          href={`/admin/preview/${dog.id}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-brand-teal/50 px-4 py-2 text-sm font-medium text-brand-teal transition hover:bg-brand-teal/10"
        >
          👁 ดูมุมมองเจ้าของ
        </Link>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-brand-gold">มาร์กความคืบหน้า 10 เกม</h3>
        <div className="space-y-3">
          {lessons.map((view) => (
            <AdminGameCard key={view.lesson.id} dogId={dogId} view={view} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-brand-cream">รูปการฝึก</h3>

        <form action={uploadSessionPhoto} className="dark-card space-y-3">
          <input type="hidden" name="dogId" value={dogId} />
          <div>
            <label className="label">เกม (ไม่บังคับ)</label>
            <select name="lessonId" className="input" defaultValue="">
              <option value="">— ไม่ระบุเกม —</option>
              {lessonList.map((l) => (
                <option key={l.id} value={l.id}>
                  {String(l.id).padStart(2, '0')} · {l.name_th}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">คำบรรยาย</label>
            <input name="caption" className="input" placeholder="เช่น ครั้งที่ 6 - Hand Target" />
          </div>
          <div>
            <label className="label">รูป</label>
            <input
              type="file"
              name="photo"
              accept="image/*"
              required
              className="block w-full text-sm text-brand-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand-gold file:px-4 file:py-2 file:font-semibold file:text-brand-ink"
            />
          </div>
          <button type="submit" className="btn-gold">
            อัปโหลดรูป
          </button>
        </form>

        {photos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photos.map((photo) => (
              <figure
                key={photo.id}
                className="overflow-hidden rounded-2xl border border-white/5 bg-brand-bgSoft"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.photo_url}
                  alt={photo.caption ?? 'รูปการฝึก'}
                  className="aspect-square w-full object-cover"
                />
                <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-xs text-brand-muted">
                  <span className="truncate">{photo.caption ?? 'การฝึก'}</span>
                  <form action={deleteSessionPhoto}>
                    <input type="hidden" name="photoId" value={photo.id} />
                    <button
                      type="submit"
                      aria-label="ลบรูป"
                      className="text-red-300 hover:text-red-200"
                    >
                      ลบ
                    </button>
                  </form>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

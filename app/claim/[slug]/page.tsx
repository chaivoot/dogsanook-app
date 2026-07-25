import Link from 'next/link';
import { notFound } from 'next/navigation';
import Logo from '@/components/Logo';
import LineIcon from '@/components/LineIcon';
import Markdown from '@/components/Markdown';
import { getCurrentProfile } from '@/lib/auth';
import { getCampaignBySlug, getMyClaim, countClaims } from '@/lib/data';
import { claimVoucher } from './actions';

// Always render the live campaign (never a cached copy).
export const dynamic = 'force-dynamic';

export default async function ClaimPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { full?: string };
}) {
  const campaign = await getCampaignBySlug(params.slug);
  if (!campaign) notFound();

  const profile = await getCurrentProfile();
  const claim = profile ? await getMyClaim(campaign.id, profile.id) : null;
  const count = await countClaims(campaign.id);
  const isFull =
    campaign.max_claims != null && count >= campaign.max_claims && !claim;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
      <div className="text-center">
        <Logo size={72} className="mx-auto" />
        <h1 className="mt-6 text-2xl font-bold text-brand-cream">
          {campaign.name}
        </h1>
        {campaign.partner && (
          <p className="mt-1 text-sm text-brand-gold">
            ร่วมกับ {campaign.partner}
          </p>
        )}
      </div>

      {campaign.description && (
        <div className="mt-5 rounded-card border border-white/5 bg-brand-bgSoft px-5 py-4">
          <Markdown>{campaign.description}</Markdown>
        </div>
      )}

      <div className="mt-8">
        {!campaign.active ? (
          <StateCard emoji="🙏" title="แคมเปญนี้ปิดรับแล้ว">
            ขอบคุณที่สนใจ ติดตามกิจกรรมหน้าได้ทาง LINE หมาสนุก
          </StateCard>
        ) : claim ? (
          <ClaimSuccess code={claim.code} />
        ) : isFull ? (
          <StateCard emoji="🎫" title="สิทธิ์เต็มแล้ว">
            แคมเปญนี้มีผู้รับสิทธิ์ครบแล้ว ติดตามรอบหน้าได้ทาง LINE หมาสนุก
          </StateCard>
        ) : !profile ? (
          <LoginGate slug={campaign.slug} />
        ) : (
          <ClaimForm slug={campaign.slug} />
        )}
      </div>

      <footer className="mt-auto pt-10 text-center text-xs text-brand-muted/60">
        หมาสนุก · ฝึกหมาสไตล์เล่นไปฝึกไป ไม่ดุ ไม่บังคับ
      </footer>
    </main>
  );
}

function StateCard({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dark-card text-center">
      <div className="text-5xl">{emoji}</div>
      <h2 className="mt-4 text-lg font-bold text-brand-cream">{title}</h2>
      <p className="mt-2 text-sm text-brand-muted">{children}</p>
    </div>
  );
}

function LoginGate({ slug }: { slug: string }) {
  return (
    <div className="dark-card text-center">
      <p className="text-brand-cream">
        เข้าสู่ระบบด้วย LINE เพื่อรับสิทธิ์ทดลองเรียนฟรี
      </p>
      <p className="mt-1 text-xs text-brand-muted">
        ใช้เวลาไม่ถึงนาที — หลังรับสิทธิ์ ครูจะติดต่อกลับเพื่อนัดวันเรียน
      </p>
      <Link
        href={`/auth/line/login?next=/claim/${slug}`}
        className="btn-gold mt-5 w-full"
      >
        <LineIcon />
        รับสิทธิ์ด้วย LINE
      </Link>
    </div>
  );
}

function ClaimForm({ slug }: { slug: string }) {
  return (
    <form action={claimVoucher} className="dark-card space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <p className="text-sm text-brand-muted">
        กรอกรายละเอียดน้องหมาเพื่อรับสิทธิ์ 🐶
      </p>
      <div>
        <label className="label">ชื่อน้อง *</label>
        <input name="dogName" required className="input" placeholder="เช่น มอมแมม" />
      </div>
      <div>
        <label className="label">พันธุ์</label>
        <input name="breed" className="input" placeholder="เช่น Shetland Sheepdog" />
      </div>
      <div>
        <label className="label">เบอร์โทร</label>
        <input
          name="phone"
          inputMode="tel"
          className="input"
          placeholder="เบอร์โทรที่ครูติดต่อกลับได้"
        />
        <p className="mt-1 text-xs text-brand-muted">
          เราได้ชื่อ LINE ของคุณจากการเข้าสู่ระบบแล้ว · ขอเบอร์ไว้ติดต่อกลับ
        </p>
      </div>
      <div>
        <label className="label">
          อะไรที่คุณรักในตัวน้องที่สุด? 🥰 (ไม่บังคับ)
        </label>
        <textarea
          name="notes"
          rows={2}
          className="input"
          placeholder="เช่น ตอนวิ่งมาหา · ยิ้มทักทายทุกเช้า · ขี้อ้อนสุด ๆ"
        />
      </div>
      <button type="submit" className="btn-gold w-full">
        ยืนยันรับสิทธิ์
      </button>
    </form>
  );
}

function ClaimSuccess({ code }: { code: string }) {
  return (
    <div className="dark-card text-center">
      <div className="text-5xl">🎉</div>
      <h2 className="mt-4 text-lg font-bold text-brand-cream">
        รับสิทธิ์เรียบร้อย!
      </h2>
      <p className="mt-2 text-sm text-brand-muted">
        แสดงรหัสนี้กับครูตอนมาเรียน · ครูจะติดต่อกลับเพื่อนัดวัน
      </p>
      <div className="mt-4 rounded-card border border-brand-gold/40 bg-brand-gold/10 px-4 py-4">
        <p className="text-xs text-brand-muted">รหัสอ้างอิง</p>
        <p className="mt-1 text-2xl font-bold tracking-widest text-brand-gold">
          {code}
        </p>
      </div>
      <p className="mt-4 text-xs text-brand-muted">
        บัญชีของคุณกำลังรอครูอนุมัติ เมื่ออนุมัติแล้วจะเข้าดูความคืบหน้าของน้องได้
      </p>
    </div>
  );
}

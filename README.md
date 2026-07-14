# dogsanook-app · ระบบติดตามการเรียนของน้องหมา

พอร์ทัลส่วนตัวสำหรับลูกค้าหมาสนุกที่ลงเรียนแล้ว เข้ามาดู/ทบทวนความคืบหน้าของน้องหมาในคอร์สฝึก **10 เกม** — deploy แยกที่ `app.dogsanook.com`

> เว็บนี้แยกจากเว็บการตลาด Astro (`dogsanook.com`) และหน้า demo มอมแมม (`/mommam`) โดยสิ้นเชิง ทุกคนต้อง **login ด้วย LINE + ถูกครูอนุมัติ** ก่อนเข้าใช้งาน

---

## Stack

- **Next.js 14** (App Router, TypeScript) + **Tailwind CSS**
- **Supabase** — Postgres · Auth · Storage · Row Level Security
- **Auth:** LINE Login ผ่าน Supabase **Custom OIDC provider**
- **Deploy:** Vercel

## โครงสร้าง

```
app/
  page.tsx                 # หน้า Login (ปุ่ม LINE)
  pending/ · blocked/      # หน้ารออนุมัติ / ถูกระงับ
  dashboard/               # Owner dashboard + server actions
  admin/                   # Admin panel (ผู้ใช้ / น้องหมา / มาร์กเกม) + server actions
  auth/callback · signout  # OAuth callback + logout
components/                # UI (การ์ดเกม, legend, progress, gallery, ฯลฯ)
lib/
  supabase/                # browser / server / service / middleware clients
  auth.ts · data.ts        # guard + data layer
  types.ts                 # โมเดลตรงกับ schema
supabase/migrations/       # SQL: 6 ตาราง + RLS + storage + seed 10 เกม
middleware.ts              # guard: pending → /pending, blocked → /blocked
```

---

## 1. เตรียม Supabase

1. สร้าง project ชื่อ `dogsanook` (region `ap-southeast-1` สิงคโปร์) จด DB password ไว้
2. รัน migrations ตามลำดับ — เลือกวิธีใดวิธีหนึ่ง:

   **ก. ผ่าน Supabase SQL Editor** — เปิดไฟล์ใน `supabase/migrations/` แล้ว paste รันทีละไฟล์ตามเลข:
   - `0001_init.sql` — 6 ตาราง + trigger สร้าง profile ครั้งแรก
   - `0002_rls.sql` — RLS policies + helper functions
   - `0003_storage.sql` — bucket `dog-photos` + policies
   - `0004_seed_lessons.sql` — seed เกม 1–10

   **ข. ผ่าน Supabase CLI**
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```

3. คัดลอกค่าจาก **Project Settings → API**: `Project URL`, `anon key`, `service_role key`

## 2. ตั้งค่า LINE Login (OIDC)

1. ที่ [LINE Developers](https://developers.line.biz/) สร้าง **Provider** → **LINE Login channel**
2. จด **Channel ID** และ **Channel Secret**
3. ในหน้า channel → **LINE Login** → เพิ่ม **Callback URL**:
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
4. ใน Supabase → **Authentication → Providers → Custom (OIDC)** เพิ่ม provider ใหม่:
   - **Provider name / slug:** `line`
   - **Issuer URL:** `https://access.line.me`
   - **Client ID:** LINE Channel ID
   - **Client Secret:** LINE Channel Secret
   - **Scopes:** `openid profile`
5. ใน Supabase → **Authentication → URL Configuration** ตั้ง **Site URL** = `https://app.dogsanook.com`
   และเพิ่ม redirect URL `https://app.dogsanook.com/auth/callback` (+ `http://localhost:3000/auth/callback` สำหรับ dev)

> โค้ดเริ่ม login ด้วย `signInWithOAuth({ provider: 'line' })` — GoTrue จะ route ตาม slug `line` ที่ตั้งไว้ ต้องตั้ง slug ให้ตรงกับ `line`

## 3. Environment variables

คัดลอก `.env.example` เป็น `.env.local` แล้วเติมค่า:

```env
LINE_CHANNEL_ID=            # LINE channel (สำรองไว้อ้างอิง — auth ทำผ่าน Supabase)
LINE_CHANNEL_SECRET=
NEXT_PUBLIC_SUPABASE_URL=   # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # service_role key (server-only, อย่า expose)
NEXT_PUBLIC_APP_URL=https://app.dogsanook.com   # dev: http://localhost:3000
```

## 4. รัน local dev

```bash
npm install
npm run dev          # http://localhost:3000
```

คำสั่งอื่น: `npm run build` · `npm run start` · `npm run lint` · `npm run typecheck`

## 5. Deploy Vercel

1. Import repo เข้า Vercel (framework auto-detect เป็น Next.js)
2. ใส่ env vars ทั้งหมด (ตั้ง `NEXT_PUBLIC_APP_URL=https://app.dogsanook.com`)
3. ตั้ง custom domain `app.dogsanook.com`
4. ตรวจว่า Supabase redirect URL / LINE callback ตรงกับโดเมน production

---

## Roles & flow

| Role | สิทธิ์ |
|---|---|
| **admin / teacher** (ครู) | อนุมัติผู้ใช้ · ผูก/แก้รายละเอียดน้อง · มาร์ก `taught` / `can_do` · อัปโหลดรูปการฝึก |
| **owner** (ลูกค้า) | มีน้องได้หลายตัว · แก้รายละเอียดน้องตัวเอง · ดูความคืบหน้า · เช็คอินการบ้าน (`practiced`) · **แก้ `taught`/`can_do` ไม่ได้** |

**Flow อนุมัติ:** login LINE ครั้งแรก → `profiles.status = 'pending'` → ครูกด **อนุมัติ** ในแผงครู → `allowed` เข้าใช้ได้ · ระหว่างนั้นเห็นหน้า "รออนุมัติ"

### ตั้งครูคนแรก (bootstrap)

ผู้ใช้ทุกคนเริ่มที่ `owner` + `pending` เพื่อตั้งครูคนแรก ให้ login ด้วย LINE หนึ่งครั้ง แล้วรันใน Supabase SQL Editor:

```sql
update public.profiles
set role = 'admin', status = 'allowed'
where line_user_id = '<LINE user id ของคุณ>';
-- หรือดู id ล่าสุดจาก: select id, display_name, line_user_id from public.profiles order by created_at desc;
```

จากนั้นครูคนนี้อนุมัติ/ตั้งบทบาทคนอื่นได้จากในแอป

---

## หมายเหตุด้านความปลอดภัย

- ทุก query ทำงานภายใต้ **RLS** ในนามผู้ใช้ที่ login — owner เห็นเฉพาะน้องของตัวเอง, staff เห็นทั้งหมด, pending/blocked เข้าไม่ได้
- **Storage bucket `dog-photos` ตั้งเป็น public read** เพื่อ render รูปใน `<img>` ได้ตรงๆ (path เป็น uuid เดาไม่ได้ และรูปฝึกหมาไม่ใช่ข้อมูลอ่อนไหว) การเขียนจำกัดเฉพาะผู้ใช้ที่อนุมัติแล้ว หากต้องการเข้มขึ้น เปลี่ยน `public = false` ใน `0003_storage.sql` แล้วปรับแอปให้ใช้ signed URLs
- `SUPABASE_SERVICE_ROLE_KEY` ใช้ฝั่ง server เท่านั้น อย่า import เข้า Client Component

## Out of scope (ทำทีหลัง)

ระบบจ่ายเงิน · คอร์ส relax/outline · Notification/reminder · รายงานสถิติหลายครู · เชื่อม LINE OA messaging

---

*หมาสนุก · ฝึกหมาสไตล์เล่นไปฝึกไป ไม่ดุ ไม่บังคับ*

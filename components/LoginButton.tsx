import Link from 'next/link';
import LineIcon from '@/components/LineIcon';

/**
 * Kicks off LINE login. We handle the OAuth flow ourselves in
 * /auth/line/login, so this is just a link — no client JS needed.
 */
export default function LoginButton() {
  return (
    <Link href="/auth/line/login" className="btn-gold w-full text-base">
      <LineIcon />
      เข้าสู่ระบบด้วย LINE
    </Link>
  );
}

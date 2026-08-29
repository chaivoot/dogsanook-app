import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE } from '@/lib/session';

/**
 * Auth gate. We own the session (a signed cookie), so the middleware just
 * checks it's valid and bounces unauthenticated users to the login page.
 * Status/role routing (pending → /pending, owner ↛ /admin) is enforced by the
 * pages via requireProfile / requireStaff, which read the live DB row.
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Reachable without an approved account: login, the LINE auth routes, the
  // voucher-claim pages, and the public game guides.
  const isPublicPath =
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/claim') ||
    pathname.startsWith('/games') ||
    pathname.startsWith('/invite');

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = await verifySessionToken(token);

  if (!payload && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

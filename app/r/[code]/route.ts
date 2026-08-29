import { NextResponse } from 'next/server';

/**
 * Referral link entry point. Stashes the referral code in a cookie and sends
 * the visitor to the landing page — attribution happens in the LINE callback
 * when a NEW profile is created.
 */
export async function GET(
  request: Request,
  { params }: { params: { code: string } },
) {
  const origin = new URL(request.url).origin;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || origin;

  const code = (params.code || '').trim().slice(0, 64);
  const res = NextResponse.redirect(`${appUrl}/`);
  if (code) {
    res.cookies.set('ds_ref', code, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }
  return res;
}

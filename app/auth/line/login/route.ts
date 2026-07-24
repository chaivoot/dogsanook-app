import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

/**
 * Starts the LINE Login (OAuth 2.1 / OIDC) flow ourselves, because Supabase
 * Auth has no built-in LINE provider. We redirect to LINE's authorize endpoint
 * and stash a CSRF `state` (+ `nonce`) in httpOnly cookies for the callback.
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || origin;
  const channelId = process.env.LINE_CHANNEL_ID?.trim();

  if (!channelId) {
    return NextResponse.redirect(`${appUrl}/?error=line_not_configured`);
  }

  // Optional post-login destination (must be a relative path).
  const nextParam = new URL(request.url).searchParams.get('next');
  const next =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : null;

  const state = randomUUID();
  const nonce = randomUUID();
  const redirectUri = `${appUrl}/auth/line/callback`;

  const authUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', channelId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', 'openid profile');
  authUrl.searchParams.set('nonce', nonce);

  const res = NextResponse.redirect(authUrl.toString());
  const opts = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 600, // 10 minutes
  };
  res.cookies.set('line_oauth_state', state, opts);
  res.cookies.set('line_oauth_nonce', nonce, opts);
  if (next) res.cookies.set('line_oauth_next', next, opts);
  return res;
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from '@/lib/session';

/** Decode a JWT payload (LINE id_token) without verifying — it came straight
 *  from LINE's token endpoint over TLS in this same request. */
function decodeJwtPayload(token: string): Record<string, unknown> {
  const part = token.split('.')[1] ?? '';
  let s = part.replace(/-/g, '+').replace(/_/g, '/');
  s += '='.repeat(s.length % 4 ? 4 - (s.length % 4) : 0);
  return JSON.parse(
    decodeURIComponent(
      atob(s)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    ),
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || origin;
  const fail = (msg: string) =>
    NextResponse.redirect(`${appUrl}/?error=${encodeURIComponent(msg)}`);

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const lineError = url.searchParams.get('error');
  if (lineError) return fail(lineError);
  if (!code || !state) return fail('missing_code');

  // CSRF check
  const savedState = cookies().get('line_oauth_state')?.value;
  if (!savedState || savedState !== state) return fail('bad_state');

  const channelId = process.env.LINE_CHANNEL_ID?.trim();
  const channelSecret = process.env.LINE_CHANNEL_SECRET?.trim();
  if (!channelId || !channelSecret) return fail('line_not_configured');

  // Exchange the code for tokens
  const redirectUri = `${appUrl}/auth/line/callback`;
  const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: channelId,
      client_secret: channelSecret,
    }),
  });

  if (!tokenRes.ok) {
    console.error('[line callback] token exchange failed:', await tokenRes.text());
    return fail('line_token_exchange_failed');
  }

  const tokenJson = (await tokenRes.json()) as { id_token?: string };
  if (!tokenJson.id_token) return fail('no_id_token');

  const claims = decodeJwtPayload(tokenJson.id_token);
  const sub = claims.sub as string | undefined;
  const name = (claims.name as string | undefined) || 'ผู้ใช้ LINE';
  if (!sub) return fail('no_sub');

  // Find or create the profile (Supabase as plain DB, via service role)
  const admin = createServiceClient();
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('line_user_id', sub)
    .maybeSingle();

  let profileId = existing?.id as string | undefined;

  if (!profileId) {
    const { data: created, error } = await admin
      .from('profiles')
      .insert({ line_user_id: sub, display_name: name })
      .select('id')
      .single();
    if (error || !created) {
      console.error('[line callback] profile create failed:', error);
      return fail('profile_create_failed');
    }
    profileId = created.id;
  } else {
    // keep the display name fresh
    await admin.from('profiles').update({ display_name: name }).eq('id', profileId);
  }

  if (!profileId) return fail('profile_create_failed');

  // Issue our signed session cookie
  const token = await createSessionToken(profileId);
  const res = NextResponse.redirect(`${appUrl}/`);
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  // clear the transient oauth cookies
  res.cookies.set('line_oauth_state', '', { path: '/', maxAge: 0 });
  res.cookies.set('line_oauth_nonce', '', { path: '/', maxAge: 0 });
  return res;
}

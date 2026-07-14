import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth/OIDC redirect target. LINE (via Supabase's custom OIDC provider) sends
 * the user back here with a `code`, which we exchange for a session. The
 * `on_auth_user_created` trigger creates the pending profile on first login.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error)}`);
  }

  if (code) {
    const supabase = createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      // The middleware will route the user to /pending, /dashboard or /admin
      // based on their approval status and role.
      return NextResponse.redirect(`${origin}/`);
    }
    return NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(exchangeError.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}/?error=missing_code`);
}

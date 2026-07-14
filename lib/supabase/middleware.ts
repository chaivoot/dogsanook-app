import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/** Paths reachable without an approved account. */
const PUBLIC_PATHS = ['/', '/auth', '/blocked'];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Refreshes the Supabase session and enforces the approval gate:
 *   - no session            → only public pages
 *   - status = pending      → locked to /pending
 *   - status = blocked      → locked to /blocked
 *   - status = allowed      → full app; owners kept out of /admin
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If the Supabase env vars aren't inlined into this build, don't crash the
  // whole site — let requests through (pages still guard via requireProfile)
  // and surface the misconfiguration in the logs.
  if (!supabaseUrl || !supabaseKey) {
    console.error(
      '[middleware] Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY at runtime. Set them in Vercel and redeploy.',
    );
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { pathname } = request.nextUrl;

  // Redirect helper that preserves refreshed auth cookies.
  const redirectTo = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = '';
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  };

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Not signed in → allow only public pages.
    if (!user) {
      if (isPublic(pathname)) return response;
      return redirectTo('/');
    }

    // Signed in → look up approval status.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single();

    const status = profile?.status ?? 'pending';
    const isStaff = profile?.role === 'admin' || profile?.role === 'teacher';

    if (status === 'blocked') {
      return pathname === '/blocked' ? response : redirectTo('/blocked');
    }

    if (status === 'pending') {
      return pathname === '/pending' ? response : redirectTo('/pending');
    }

    // status === 'allowed'
    const home = isStaff ? '/admin' : '/dashboard';

    // Bounce approved users away from the login / waiting pages.
    if (pathname === '/' || pathname === '/pending' || pathname === '/blocked') {
      return redirectTo(home);
    }

    // Owners cannot access the admin panel.
    if (pathname.startsWith('/admin') && !isStaff) {
      return redirectTo('/dashboard');
    }

    return response;
  } catch (err) {
    // Never let an auth/DB hiccup take the whole site down with a 500.
    // Pages still enforce access via requireProfile().
    console.error('[middleware] auth check failed:', err);
    return response;
  }
}

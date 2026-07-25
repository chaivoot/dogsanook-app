import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client that bypasses RLS. Server-only — never import this into
 * a Client Component. Used for privileged tasks (e.g. admin listing all
 * pending users) where we still enforce authorization in application code.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      // Never let Next.js cache DB reads — this is a live app, not a blog.
      // Without this, edited data can keep showing its old value.
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
      },
    },
  );
}

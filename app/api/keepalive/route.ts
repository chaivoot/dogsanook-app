import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

// Never cached — must actually hit the DB each time.
export const dynamic = 'force-dynamic';

/**
 * Lightweight DB ping to keep the Supabase project from auto-pausing on the
 * free tier (it pauses after ~7 days of inactivity). Hit daily by a Vercel
 * Cron job (see vercel.json). Any real query counts as activity.
 */
export async function GET(request: Request) {
  // If CRON_SECRET is set, require it (Vercel Cron sends it as a Bearer token).
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from('lessons').select('id').limit(1);

  return NextResponse.json({
    ok: !error,
    at: new Date().toISOString(),
  });
}

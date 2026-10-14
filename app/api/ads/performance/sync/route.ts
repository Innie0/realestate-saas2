// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';
import { syncAdPerformance } from '@/lib/ads/sync-ad-performance';
import { APIResponse } from '@/types';

// Performance rows are written with the service role (users can only read them)
const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/** Minimum gap between refreshes for one agent — each one spends ad-platform API quota. */
const MIN_INTERVAL_MS = 5 * 60 * 1000;
const lastSyncByUser = new Map<string, number>();

/**
 * POST /api/ads/performance/sync
 * Pull the latest results for the signed-in agent's ads right now, instead of
 * waiting for the nightly sync.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' } satisfies APIResponse, {
        status: 401,
      });
    }

    const last = lastSyncByUser.get(user.id) ?? 0;
    if (Date.now() - last < MIN_INTERVAL_MS) {
      return NextResponse.json({ success: true, data: { skipped: true } } satisfies APIResponse);
    }
    lastSyncByUser.set(user.id, Date.now());

    const result = await syncAdPerformance(supabaseAdmin, { userId: user.id });
    return NextResponse.json({ success: true, data: result } satisfies APIResponse);
  } catch (error: any) {
    console.error('Ad performance sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Could not refresh results' } satisfies APIResponse,
      { status: 500 }
    );
  }
}

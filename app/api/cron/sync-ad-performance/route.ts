// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rejectUnauthorizedCron } from '@/lib/cron-auth';
import { syncAdPerformanceForAllUsers } from '@/lib/ads/sync-ad-performance';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  const denied = rejectUnauthorizedCron(request);
  if (denied) return denied;

  try {
    const result = await syncAdPerformanceForAllUsers(supabaseAdmin);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Cron sync-ad-performance error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}

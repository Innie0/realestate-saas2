// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { rejectUnauthorizedCron } from '@/lib/cron-auth';
import { syncPublishedProjects, summarizeSyncResults } from '@/lib/listing-sync';
import { isRentcastConfigured } from '@/lib/rentcast-listings';

async function handleCron(request: NextRequest) {
  const denied = rejectUnauthorizedCron(request);
  if (denied) return denied;

  if (!isRentcastConfigured()) {
    return NextResponse.json(
      { success: false, error: 'RENTCAST_API_KEY is not configured' },
      { status: 503 }
    );
  }

  try {
    const supabase = createAdminClient();
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('id, user_id, title, published, property_info, listing_status')
      .eq('published', true);

    if (fetchError) {
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!projects?.length) {
      return NextResponse.json({
        success: true,
        message: 'No published listings to sync',
        summary: summarizeSyncResults([]),
      });
    }

    const { results, changed } = await syncPublishedProjects(supabase, projects);
    const summary = summarizeSyncResults(results);

    console.log('[Cron] Listing sync:', summary);

    return NextResponse.json({
      success: true,
      message: `Synced ${summary.total} listing(s)`,
      summary,
      changed,
      results,
    });
  } catch (error) {
    console.error('Cron sync-listings error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

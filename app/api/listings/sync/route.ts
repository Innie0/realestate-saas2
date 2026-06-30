// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { syncPublishedProjects, summarizeSyncResults } from '@/lib/listing-sync';
import { isRentcastConfigured } from '@/lib/rentcast-listings';

/** POST /api/listings/sync — sync published listings with Rentcast (optional projectId). */
export async function POST(request: Request) {
  try {
    if (!isRentcastConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rentcast is not configured. Add RENTCAST_API_KEY to your environment.',
        },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let projectId: string | null = null;
    try {
      const body = await request.json();
      if (body?.projectId && typeof body.projectId === 'string') {
        projectId = body.projectId;
      }
    } catch {
      // empty body is fine — sync all published
    }

    let query = supabase
      .from('projects')
      .select('id, user_id, title, published, property_info, listing_status')
      .eq('user_id', user.id);

    if (projectId) {
      query = query.eq('id', projectId);
    } else {
      query = query.eq('published', true);
    }

    const { data: projects, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: 'Failed to load listings' },
        { status: 500 }
      );
    }

    if (!projects?.length) {
      return NextResponse.json({
        success: true,
        data: {
          summary: summarizeSyncResults([]),
          results: [],
          message: projectId ? 'Listing not found' : 'No published listings to sync',
        },
      });
    }

    const toSync = projectId ? projects : projects.filter((p) => p.published);

    if (!toSync.length) {
      return NextResponse.json({
        success: true,
        data: {
          summary: summarizeSyncResults([]),
          results: [],
          message: 'Publish the listing first to sync with Rentcast',
        },
      });
    }

    const { results, changed } = await syncPublishedProjects(supabase, toSync);

    const summary = summarizeSyncResults(results);
    const parts: string[] = [];
    if (summary.listingUpdated) parts.push(`${summary.listingUpdated} listing update(s)`);
    if (summary.sold) parts.push(`${summary.sold} sold`);
    if (summary.offMarket) parts.push(`${summary.offMarket} off market`);
    if (summary.needsReview) parts.push(`${summary.needsReview} need review`);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        results,
        changed,
        message: parts.length ? parts.join(', ') : 'All listings up to date',
      },
    });
  } catch (error) {
    console.error('POST /api/listings/sync:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

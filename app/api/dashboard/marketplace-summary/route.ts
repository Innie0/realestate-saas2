// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { formatListingAddress } from '@/lib/listing-utils';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [{ data: projects, error: projectsError }, { data: inquiries, error: inquiriesError }] =
      await Promise.all([
        supabase
          .from('projects')
          .select('id, title, property_info, published, published_at, updated_at, listing_status, last_synced_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('clients')
          .select(
            `
            id,
            name,
            message,
            created_at,
            project_id,
            projects:project_id (
              id,
              title,
              property_info
            )
          `
          )
          .eq('user_id', user.id)
          .eq('source', 'listing_page')
          .eq('in_crm', false)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

    if (projectsError) {
      console.error('marketplace-summary projects:', projectsError);
      return NextResponse.json(
        { success: false, error: 'Failed to load listings' },
        { status: 500 }
      );
    }

    if (inquiriesError) {
      console.error('marketplace-summary inquiries:', inquiriesError);
    }

    const published = (projects || []).filter((p) => p.published);
    const drafts = (projects || []).filter((p) => !p.published);
    const needsReviewCount = (projects || []).filter(
      (p) => p.published && p.listing_status === 'unknown'
    ).length;

    const recentPublished = published.slice(0, 4).map((p) => {
      const info = (p.property_info || {}) as {
        address?: string;
        city?: string;
        state?: string;
        zip_code?: string;
      };
      return {
        id: p.id,
        title: p.title,
        address: formatListingAddress(info, p.title),
        publishedAt: p.published_at,
      };
    });

    const recentListingInquiries = (inquiries || []).map((row) => {
      const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
      const info = project?.property_info as
        | { address?: string; city?: string; state?: string; zip_code?: string }
        | undefined;
      const listingLabel = project ? formatListingAddress(info, project.title) : null;
      const msg = typeof row.message === 'string' ? row.message : '';
      const fromMessage = msg.match(/interested in\s+(.+)/i)?.[1]?.trim();

      return {
        id: row.id,
        name: row.name,
        createdAt: row.created_at,
        projectId: row.project_id as string | null,
        listingLabel: listingLabel || fromMessage || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        publishedCount: published.length,
        draftCount: drafts.length,
        needsReviewCount,
        recentPublished,
        recentListingInquiries,
        draftReadyToPublish: drafts.filter((p) => {
          const info = p.property_info || {};
          return Boolean(info.address && info.price);
        }).length,
      },
    });
  } catch (error) {
    console.error('GET /api/dashboard/marketplace-summary:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// @ts-nocheck
// Lightweight id + created_at only endpoint for dashboard-home metrics.
//
// Dashboard home only needs client creation timestamps (to build the
// weekly lead trend and hot-lead / new-leads-7d counts) — never the full
// row with joined projects/notes/reminders or sequence-enrichment that
// the CRM/Leads pages need from /api/clients. This mirrors the same
// filter semantics (status, view) but selects only the two fields used,
// with no joins and no extra sequential queries.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'active';
    const view = searchParams.get('view'); // 'crm' (default) | 'inbox'

    let query = supabase
      .from('clients')
      .select('id, created_at')
      .eq('user_id', user.id);

    // Same CRM vs. inbox split as /api/clients.
    if (view === 'inbox') {
      query = query.eq('in_crm', false).in('source', ['lead_form', 'open_house', 'listing_page']);
    } else {
      query = query.eq('in_crm', true);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching lite clients:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch clients' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
    });
  } catch (error) {
    console.error('Error in GET /api/clients/lite:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

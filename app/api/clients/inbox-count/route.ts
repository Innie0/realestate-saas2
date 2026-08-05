// @ts-nocheck
// Lightweight count-only endpoint for the sidebar's inbox lead badge.
//
// The full /api/clients?view=inbox endpoint returns every lead with joined
// notes/reminders/sequence data (needed for the Leads inbox page), which is
// far more than the sidebar badge needs. This endpoint runs a single
// head-only count query so the badge can load quickly without paying for
// that payload on every page.
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

    const { count, error } = await supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('in_crm', false)
      .in('source', ['lead_form', 'open_house', 'listing_page']);

    if (error) {
      console.error('Error counting inbox leads:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to count inbox leads' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { count: count ?? 0 },
    });
  } catch (error) {
    console.error('Error in GET /api/clients/inbox-count:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

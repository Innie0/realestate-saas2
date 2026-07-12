// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { APIResponse } from '@/types';

export async function GET(request: NextRequest) {
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

    const { data: promotions, error } = await supabase
      .from('ad_promotions')
      .select(
        `
        id, project_id, platform, daily_budget_cents, duration_days, status,
        headline, landing_url, created_at, meta_campaign_id, error_message,
        projects:project_id ( id, title, property_info, images, published )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, data: [] } satisfies APIResponse);
      }
      throw error;
    }

    return NextResponse.json({ success: true, data: promotions ?? [] } satisfies APIResponse);
  } catch (error: any) {
    console.error('Get promotions error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load promotions' } satisfies APIResponse,
      { status: 500 }
    );
  }
}

// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { APIResponse } from '@/types';
import type { AdType } from '@/lib/ads/ad-draft-types';

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

    const forWizard = request.nextUrl.searchParams.get('forWizard') === '1';
    const adType = request.nextUrl.searchParams.get('adType');

    let query = supabase
      .from('ad_ai_insights')
      .select('*')
      .eq('user_id', user.id)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(forWizard ? 3 : 20);

    if (adType) {
      query = query.or(`ad_type.eq.${adType},ad_type.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, data: [] } satisfies APIResponse);
      }
      throw error;
    }

    const insights = (data ?? []).map((row) => ({
      id: row.id,
      agentId: row.user_id,
      type: row.type,
      message: row.message,
      suggestedAction: row.suggested_action,
      relatedAdIds: row.related_ad_ids ?? [],
      adType: row.ad_type as AdType | null,
      platform: row.platform,
      metadata: row.metadata ?? {},
      dismissed: row.dismissed,
      createdAt: row.created_at,
    }));

    return NextResponse.json({ success: true, data: insights } satisfies APIResponse);
  } catch (error: any) {
    console.error('GET /api/ads/insights:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load insights' } satisfies APIResponse,
      { status: 500 }
    );
  }
}

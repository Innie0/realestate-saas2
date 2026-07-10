// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { fetchCampaignsForConnections, summarizeCampaigns } from '@/lib/ads/fetch-campaigns';
import { APIResponse } from '@/types';
import type { AdPlatform } from '@/lib/ads/types';

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

    const platform = request.nextUrl.searchParams.get('platform') as AdPlatform | 'all' | null;

    const { data: connections, error } = await supabase
      .from('ad_platform_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({
          success: true,
          data: { campaigns: [], summary: summarizeCampaigns([], []) },
        } satisfies APIResponse);
      }
      throw error;
    }

    const activeConnections = (connections ?? []).filter((c) =>
      platform && platform !== 'all' ? c.provider === platform : true
    );

    const campaigns = await fetchCampaignsForConnections(activeConnections);
    const connectedPlatforms = [...new Set((connections ?? []).map((c) => c.provider))] as AdPlatform[];
    const summary = summarizeCampaigns(campaigns, connectedPlatforms);

    return NextResponse.json({
      success: true,
      data: { campaigns, summary },
    } satisfies APIResponse);
  } catch (error: any) {
    console.error('Get ad campaigns error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load campaigns' } satisfies APIResponse,
      { status: 500 }
    );
  }
}

// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  aggregatePromotionMetrics,
  generateInsightsFromMetrics,
  persistInsights,
} from '@/lib/ads/analyze-performance';
import { syncAdPerformanceForAllUsers } from '@/lib/ads/sync-ad-performance';
import { createAdminClient } from '@/lib/supabase-admin';
import { APIResponse } from '@/types';

export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => ({}));
    const syncFirst = body.sync !== false;

    let syncResult = null;
    if (syncFirst && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = createAdminClient();
      syncResult = await syncAdPerformanceForAllUsers(admin);
    }

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 30);
    const sinceStr = since.toISOString().slice(0, 10);

    const { data: promotions } = await supabase
      .from('ad_promotions')
      .select('id, ad_type, platform, headline')
      .eq('user_id', user.id);

    const { data: daily } = await supabase
      .from('ad_performance_daily')
      .select('promotion_id, date, impressions, clicks, spend_cents, leads, frequency')
      .eq('user_id', user.id)
      .gte('date', sinceStr);

    const dailyByPromo = new Map<string, typeof daily>();
    for (const row of daily ?? []) {
      if (!dailyByPromo.has(row.promotion_id)) dailyByPromo.set(row.promotion_id, []);
      dailyByPromo.get(row.promotion_id)!.push(row);
    }

    const metrics = (promotions ?? []).map((p) =>
      aggregatePromotionMetrics(p, dailyByPromo.get(p.id) ?? [])
    );

    const rawInsights = generateInsightsFromMetrics(metrics.filter((m) => m.impressions > 0));
    const inserted = await persistInsights(supabase, user.id, rawInsights);

    const { data: stored } = await supabase
      .from('ad_ai_insights')
      .select('*')
      .eq('user_id', user.id)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(20);

    const insights = (stored ?? []).map(mapInsightRow);

    return NextResponse.json({
      success: true,
      data: insights,
      meta: { inserted, sync: syncResult },
    } satisfies APIResponse);
  } catch (error: any) {
    console.error('analyze-performance error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Analysis failed' } satisfies APIResponse,
      { status: 500 }
    );
  }
}

function mapInsightRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    agentId: row.user_id,
    type: row.type,
    message: row.message,
    suggestedAction: row.suggested_action,
    relatedAdIds: row.related_ad_ids ?? [],
    adType: row.ad_type ?? null,
    platform: row.platform ?? null,
    metadata: row.metadata ?? {},
    dismissed: row.dismissed,
    createdAt: row.created_at,
  };
}

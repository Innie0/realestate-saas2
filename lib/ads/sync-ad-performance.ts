import type { SupabaseClient } from '@supabase/supabase-js';
import {
  aggregatePromotionMetrics,
  generateInsightsFromMetrics,
  persistInsights,
} from '@/lib/ads/analyze-performance';
import { daysAgo, fetchMetaAdDailyInsights } from '@/lib/ads/fetch-meta-insights';

interface SyncResult {
  promotionsSynced: number;
  rowsUpserted: number;
  insightsCreated: number;
  errors: string[];
}

export async function syncAdPerformanceForAllUsers(
  supabase: SupabaseClient
): Promise<SyncResult> {
  const since = daysAgo(30);
  const until = daysAgo(0);
  const result: SyncResult = {
    promotionsSynced: 0,
    rowsUpserted: 0,
    insightsCreated: 0,
    errors: [],
  };

  const { data: promotions, error } = await supabase
    .from('ad_promotions')
    .select(
      'id, user_id, platform, meta_ad_id, status, ad_type, headline, daily_budget_cents, duration_days'
    )
    .in('status', ['active', 'ended', 'paused'])
    .not('meta_ad_id', 'is', null);

  if (error) {
    if (error.code === '42P01') return result;
    throw error;
  }

  const userIds = [...new Set((promotions ?? []).map((p) => p.user_id))];
  const connectionsByUser = new Map<string, { access_token: string }>();

  for (const userId of userIds) {
    const { data: conn } = await supabase
      .from('ad_platform_connections')
      .select('access_token')
      .eq('user_id', userId)
      .eq('provider', 'meta')
      .eq('is_active', true)
      .maybeSingle();
    if (conn?.access_token) connectionsByUser.set(userId, conn);
  }

  const metricsByUser = new Map<string, ReturnType<typeof aggregatePromotionMetrics>[]>();

  for (const promo of promotions ?? []) {
    if (promo.platform !== 'meta' || !promo.meta_ad_id) continue;
    const conn = connectionsByUser.get(promo.user_id);
    if (!conn) continue;

    try {
      const daily = await fetchMetaAdDailyInsights(
        conn.access_token,
        promo.meta_ad_id,
        since,
        until
      );

      for (const row of daily) {
        const start = `${row.date}T00:00:00.000Z`;
        const endDate = new Date(`${row.date}T00:00:00.000Z`);
        endDate.setUTCDate(endDate.getUTCDate() + 1);
        const end = endDate.toISOString();

        const { count: leadCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', promo.user_id)
          .eq('ad_promotion_id', promo.id)
          .gte('created_at', start)
          .lt('created_at', end);

        const leads = Math.max(row.leads, leadCount ?? 0);

        const { error: upsertError } = await supabase.from('ad_performance_daily').upsert(
          {
            promotion_id: promo.id,
            user_id: promo.user_id,
            platform: 'meta',
            date: row.date,
            impressions: row.impressions,
            clicks: row.clicks,
            spend_cents: row.spendCents,
            leads,
            frequency: row.frequency,
          },
          { onConflict: 'promotion_id,date' }
        );

        if (!upsertError) result.rowsUpserted += 1;
      }

      result.promotionsSynced += 1;

      const { data: storedDaily } = await supabase
        .from('ad_performance_daily')
        .select('date, impressions, clicks, spend_cents, leads, frequency')
        .eq('promotion_id', promo.id)
        .gte('date', since);

      const metrics = aggregatePromotionMetrics(promo, storedDaily ?? []);
      if (!metricsByUser.has(promo.user_id)) metricsByUser.set(promo.user_id, []);
      metricsByUser.get(promo.user_id)!.push(metrics);
    } catch (e: any) {
      result.errors.push(`${promo.id}: ${e.message || 'sync failed'}`);
    }
  }

  for (const [userId, metrics] of metricsByUser) {
    const insights = generateInsightsFromMetrics(metrics);
    result.insightsCreated += await persistInsights(supabase, userId, insights);
  }

  return result;
}

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  aggregatePromotionMetrics,
  generateInsightsFromMetrics,
  persistInsights,
} from '@/lib/ads/analyze-performance';
import { daysAgo, fetchMetaAdDailyInsights } from '@/lib/ads/fetch-meta-insights';
import { fetchGoogleAdDailyInsights } from '@/lib/ads/fetch-google-insights';
import { getFreshGoogleAccessToken } from '@/lib/ads/google-connection';
import type { AdPlatformConnectionRow } from '@/lib/ads/types';

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

  const baseColumns =
    'id, user_id, platform, meta_ad_id, status, ad_type, headline, daily_budget_cents, duration_days';
  const withGoogle = await supabase
    .from('ad_promotions')
    .select(`${baseColumns}, google_customer_id, google_campaign_id`)
    .in('status', ['active', 'ended', 'paused']);

  let promotions: any[] | null = withGoogle.data;
  let error = withGoogle.error;
  // 42703 = Google columns not added yet (ads-google-promotions.sql) — sync Meta only
  if (error?.code === '42703') {
    const metaOnly = await supabase
      .from('ad_promotions')
      .select(baseColumns)
      .in('status', ['active', 'ended', 'paused']);
    promotions = metaOnly.data;
    error = metaOnly.error;
  }

  if (error) {
    if (error.code === '42P01') return result;
    throw error;
  }

  const userIds = [...new Set((promotions ?? []).map((p) => p.user_id))];
  const connectionsByUser = new Map<string, AdPlatformConnectionRow>();
  const connectionKey = (userId: string, platform: string) => `${userId}:${platform}`;

  if (userIds.length > 0) {
    const { data: conns } = await supabase
      .from('ad_platform_connections')
      .select('*')
      .in('user_id', userIds)
      .eq('is_active', true);
    for (const conn of conns ?? []) {
      if (conn.access_token) connectionsByUser.set(connectionKey(conn.user_id, conn.provider), conn);
    }
  }

  /** Daily rows for one promotion from its ad platform; null when it can't be synced. */
  const fetchDaily = async (promo: any) => {
    const conn = connectionsByUser.get(connectionKey(promo.user_id, promo.platform));
    if (!conn) return null;

    if (promo.platform === 'meta') {
      if (!promo.meta_ad_id) return null;
      return fetchMetaAdDailyInsights(conn.access_token, promo.meta_ad_id, since, until);
    }

    if (promo.platform === 'google') {
      const customerId = promo.google_customer_id || conn.account_id;
      if (!promo.google_campaign_id || !customerId) return null;
      const accessToken = await getFreshGoogleAccessToken(supabase, conn);
      return fetchGoogleAdDailyInsights(
        { accessToken, loginCustomerId: conn.login_customer_id },
        customerId,
        promo.google_campaign_id,
        since,
        until,
      );
    }

    return null;
  };

  const metricsByUser = new Map<string, ReturnType<typeof aggregatePromotionMetrics>[]>();

  for (const promo of promotions ?? []) {
    try {
      const daily = await fetchDaily(promo);
      if (!daily) continue;

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
            platform: promo.platform,
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

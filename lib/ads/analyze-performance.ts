import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdType } from '@/lib/ads/ad-draft-types';
import { getAdTypeLabel } from '@/lib/ads/ad-type-config';
import type { AIInsightType } from '@/lib/ads/performance-types';
import { ctrPercent, costPerLeadCents } from '@/lib/ads/performance-types';

export interface PromotionMetrics {
  promotionId: string;
  adType: AdType | null;
  platform: string;
  headline: string | null;
  impressions: number;
  clicks: number;
  spendCents: number;
  leads: number;
  ctr: number;
  costPerLead: number | null;
  avgFrequency: number | null;
  /** CTR from first half of daily rows vs second half (fatigue signal) */
  ctrTrend: 'up' | 'down' | 'flat';
  frequencyTrend: 'up' | 'down' | 'flat';
}

export interface RawInsight {
  type: AIInsightType;
  message: string;
  suggestedAction: string;
  relatedAdIds: string[];
  adType?: AdType | null;
  platform?: string | null;
  metadata?: Record<string, unknown>;
}

interface DailyRow {
  date: string;
  impressions: number;
  clicks: number;
  spend_cents: number;
  leads: number;
  frequency: number | null;
}

function trendFromHalves(
  rows: DailyRow[],
  pick: (r: DailyRow) => number
): 'up' | 'down' | 'flat' {
  if (rows.length < 4) return 'flat';
  const mid = Math.floor(rows.length / 2);
  const first = rows.slice(0, mid);
  const second = rows.slice(mid);
  const avg = (arr: DailyRow[]) =>
    arr.length ? arr.reduce((s, r) => s + pick(r), 0) / arr.length : 0;
  const a = avg(first);
  const b = avg(second);
  if (a === 0 && b === 0) return 'flat';
  const delta = (b - a) / (a || 1);
  if (delta > 0.1) return 'up';
  if (delta < -0.1) return 'down';
  return 'flat';
}

export function aggregatePromotionMetrics(
  promotion: {
    id: string;
    ad_type: string | null;
    platform: string;
    headline: string | null;
  },
  daily: DailyRow[]
): PromotionMetrics {
  const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date));
  const impressions = sorted.reduce((s, r) => s + r.impressions, 0);
  const clicks = sorted.reduce((s, r) => s + r.clicks, 0);
  const spendCents = sorted.reduce((s, r) => s + r.spend_cents, 0);
  const leads = sorted.reduce((s, r) => s + r.leads, 0);
  const freqRows = sorted.filter((r) => r.frequency != null);
  const avgFrequency =
    freqRows.length > 0
      ? Math.round((freqRows.reduce((s, r) => s + (r.frequency ?? 0), 0) / freqRows.length) * 100) /
        100
      : null;

  const ctrTrend =
    trendFromHalves(sorted, (r) => (r.impressions > 0 ? r.clicks / r.impressions : 0)) === 'down'
      ? 'down'
      : trendFromHalves(sorted, (r) => (r.impressions > 0 ? r.clicks / r.impressions : 0)) === 'up'
        ? 'up'
        : 'flat';

  const frequencyTrend = trendFromHalves(sorted, (r) => r.frequency ?? 0);

  return {
    promotionId: promotion.id,
    adType: (promotion.ad_type as AdType) || null,
    platform: promotion.platform,
    headline: promotion.headline,
    impressions,
    clicks,
    spendCents,
    leads,
    ctr: ctrPercent(clicks, impressions),
    costPerLead: costPerLeadCents(spendCents, leads),
    avgFrequency,
    ctrTrend,
    frequencyTrend,
  };
}

export function generateInsightsFromMetrics(metrics: PromotionMetrics[]): RawInsight[] {
  if (metrics.length === 0) return [];

  const withData = metrics.filter((m) => m.impressions >= 100);
  if (withData.length === 0) return [];

  const insights: RawInsight[] = [];
  const avgCtr = withData.reduce((s, m) => s + m.ctr, 0) / withData.length;
  const avgCpl =
    withData.filter((m) => m.costPerLead != null).reduce((s, m) => s + (m.costPerLead ?? 0), 0) /
      Math.max(1, withData.filter((m) => m.costPerLead != null).length) || null;

  // By ad type aggregates
  const byType = new Map<string, PromotionMetrics[]>();
  for (const m of withData) {
    const key = m.adType || 'unknown';
    if (!byType.has(key)) byType.set(key, []);
    byType.get(key)!.push(m);
  }

  const typeStats = [...byType.entries()].map(([adType, rows]) => {
    const imp = rows.reduce((s, r) => s + r.impressions, 0);
    const clk = rows.reduce((s, r) => s + r.clicks, 0);
    const spend = rows.reduce((s, r) => s + r.spendCents, 0);
    const leads = rows.reduce((s, r) => s + r.leads, 0);
    return {
      adType: adType as AdType | 'unknown',
      ctr: ctrPercent(clk, imp),
      costPerLead: costPerLeadCents(spend, leads),
      ids: rows.map((r) => r.promotionId),
    };
  });

  if (typeStats.length >= 2) {
    const sorted = [...typeStats].sort((a, b) => b.ctr - a.ctr);
    const best = sorted[0];
    const restAvg =
      sorted.slice(1).reduce((s, t) => s + t.ctr, 0) / Math.max(1, sorted.length - 1);
    if (best.ctr >= restAvg * 1.5 && best.ctr > 0.5) {
      const label =
        best.adType === 'unknown' ? 'This ad style' : getAdTypeLabel(best.adType as AdType);
      insights.push({
        type: 'winner',
        message: `Your ${label.toLowerCase()} ads get about ${(best.ctr / Math.max(restAvg, 0.01)).toFixed(1)}× the click rate of your other ad types.`,
        suggestedAction: `Create more ${label.toLowerCase()} ads while this pattern is working.`,
        relatedAdIds: best.ids.slice(0, 5),
        adType: best.adType === 'unknown' ? null : (best.adType as AdType),
        metadata: { bestCtr: best.ctr, restAvgCtr: restAvg },
      });
    }

    const withCpl = typeStats.filter((t) => t.costPerLead != null);
    if (withCpl.length >= 2 && avgCpl != null) {
      const cheapest = [...withCpl].sort((a, b) => (a.costPerLead ?? 0) - (b.costPerLead ?? 0))[0];
      const priciest = [...withCpl].sort((a, b) => (b.costPerLead ?? 0) - (a.costPerLead ?? 0))[0];
      if (
        cheapest.costPerLead != null &&
        priciest.costPerLead != null &&
        priciest.costPerLead > cheapest.costPerLead * 1.4
      ) {
        const cheapLabel =
          cheapest.adType === 'unknown'
            ? 'One ad type'
            : getAdTypeLabel(cheapest.adType as AdType);
        insights.push({
          type: 'budget_reallocation',
          message: `${cheapLabel} ads cost less per lead ($${(cheapest.costPerLead / 100).toFixed(0)} vs $${(priciest.costPerLead / 100).toFixed(0)}).`,
          suggestedAction: 'Shift a portion of daily budget toward the lower cost-per-lead ad type.',
          relatedAdIds: cheapest.ids.slice(0, 3),
          adType: cheapest.adType === 'unknown' ? null : (cheapest.adType as AdType),
          metadata: { cheapCpl: cheapest.costPerLead, highCpl: priciest.costPerLead },
        });
      }
    }
  }

  for (const m of withData) {
    if (m.ctr < avgCtr * 0.5 && m.impressions >= 500) {
      insights.push({
        type: 'underperformer',
        message: `"${m.headline || 'One of your ads'}" is clicking at ${m.ctr.toFixed(2)}% — below your average of ${avgCtr.toFixed(2)}%.`,
        suggestedAction: 'Refresh the headline and image, or narrow the audience radius.',
        relatedAdIds: [m.promotionId],
        adType: m.adType,
        platform: m.platform,
        metadata: { ctr: m.ctr, avgCtr },
      });
    }

    if (
      m.avgFrequency != null &&
      m.avgFrequency >= 2.5 &&
      m.ctrTrend === 'down' &&
      m.frequencyTrend === 'up' &&
      m.impressions >= 300
    ) {
      insights.push({
        type: 'creative_fatigue',
        message: `"${m.headline || 'An ad'}" was performing well but clicks are dropping as frequency climbs (${m.avgFrequency.toFixed(1)}×).`,
        suggestedAction: 'Refresh the creative with a new photo or headline — keep the campaign running.',
        relatedAdIds: [m.promotionId],
        adType: m.adType,
        platform: m.platform,
        metadata: { avgFrequency: m.avgFrequency, ctrTrend: m.ctrTrend },
      });
    }
  }

  // Audience tuning: high CTR + low spend = suggest similar defaults
  const efficient = withData.filter(
    (m) => m.ctr >= avgCtr * 1.25 && m.impressions >= 200
  );
  if (efficient.length > 0 && insights.every((i) => i.type !== 'audience_tuning')) {
    const top = efficient.sort((a, b) => b.ctr - a.ctr)[0];
    insights.push({
      type: 'audience_tuning',
      message: `Your best recent ad (${top.ctr.toFixed(2)}% CTR) may benefit from using similar targeting on new campaigns.`,
      suggestedAction: 'Use the same audience radius and age range when you create your next ad.',
      relatedAdIds: [top.promotionId],
      adType: top.adType,
      platform: top.platform,
      metadata: { ctr: top.ctr },
    });
  }

  return insights.slice(0, 8);
}

export async function persistInsights(
  supabase: SupabaseClient,
  userId: string,
  insights: RawInsight[]
): Promise<number> {
  if (insights.length === 0) return 0;

  const { data: existing } = await supabase
    .from('ad_ai_insights')
    .select('id, type, related_ad_ids, dismissed')
    .eq('user_id', userId)
    .eq('dismissed', false);

  const existingKeys = new Set(
    (existing ?? []).map((e) => `${e.type}:${[...(e.related_ad_ids || [])].sort().join(',')}`)
  );

  let inserted = 0;
  for (const insight of insights) {
    const key = `${insight.type}:${[...insight.relatedAdIds].sort().join(',')}`;
    if (existingKeys.has(key)) continue;

    const { error } = await supabase.from('ad_ai_insights').insert({
      user_id: userId,
      type: insight.type,
      message: insight.message,
      suggested_action: insight.suggestedAction,
      related_ad_ids: insight.relatedAdIds,
      ad_type: insight.adType ?? null,
      platform: insight.platform ?? null,
      metadata: insight.metadata ?? {},
    });

    if (!error) {
      inserted += 1;
      existingKeys.add(key);
    }
  }

  return inserted;
}

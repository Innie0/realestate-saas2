/** Daily Google Ads performance for one campaign, read with GAQL. */
import {
  getGoogleAdsDeveloperToken,
  searchGoogleAds,
  type GoogleAdsAuth,
} from '@/lib/ads/google-ads-api';

export interface GoogleDailyInsight {
  date: string;
  impressions: number;
  clicks: number;
  spendCents: number;
  frequency: number | null;
  leads: number;
}

interface CampaignMetricsRow {
  segments?: { date?: string };
  metrics?: {
    impressions?: string | number;
    clicks?: string | number;
    costMicros?: string | number;
    conversions?: number;
  };
}

/** `since` / `until` are YYYY-MM-DD, inclusive. */
export async function fetchGoogleAdDailyInsights(
  auth: GoogleAdsAuth,
  customerId: string,
  campaignId: string,
  since: string,
  until: string,
): Promise<GoogleDailyInsight[]> {
  if (!/^\d+$/.test(campaignId)) return [];

  const rows = await searchGoogleAds<CampaignMetricsRow>(
    customerId,
    `SELECT segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
     FROM campaign
     WHERE campaign.id = ${campaignId} AND segments.date BETWEEN '${since}' AND '${until}'`,
    auth,
  );

  return rows
    .filter((r) => r.segments?.date)
    .map((r) => ({
      date: String(r.segments!.date),
      impressions: Number(r.metrics?.impressions ?? 0),
      clicks: Number(r.metrics?.clicks ?? 0),
      // Google reports cost in millionths of the account currency
      spendCents: Math.round(Number(r.metrics?.costMicros ?? 0) / 10_000),
      frequency: null,
      leads: Math.round(Number(r.metrics?.conversions ?? 0)),
    }));
}

export function isGoogleAdsReportingConfigured(): boolean {
  return Boolean(getGoogleAdsDeveloperToken());
}

export interface GoogleAdReview {
  /** `APPROVED`, `APPROVED_LIMITED`, `DISAPPROVED`, `AREA_OF_INTEREST_ONLY`, or `UNKNOWN` while in review */
  approvalStatus: string;
  /** Policy topics Google flagged, e.g. `HOUSING` or `PUNCTUATION` */
  topics: string[];
}

interface AdReviewRow {
  adGroupAd?: {
    policySummary?: {
      approvalStatus?: string;
      policyTopicEntries?: { topic?: string }[];
    };
  };
}

/** Whether Google approved the campaign's ad, and what it flagged if not. */
export async function fetchGoogleAdReview(
  auth: GoogleAdsAuth,
  customerId: string,
  campaignId: string,
): Promise<GoogleAdReview | null> {
  if (!/^\d+$/.test(campaignId)) return null;

  const rows = await searchGoogleAds<AdReviewRow>(
    customerId,
    `SELECT ad_group_ad.policy_summary.approval_status, ad_group_ad.policy_summary.policy_topic_entries
     FROM ad_group_ad
     WHERE campaign.id = ${campaignId} AND ad_group_ad.status != 'REMOVED'`,
    auth,
  );
  const summary = rows[0]?.adGroupAd?.policySummary;
  if (!summary) return null;
  return {
    approvalStatus: summary.approvalStatus ?? 'UNKNOWN',
    topics: [...new Set((summary.policyTopicEntries ?? []).map((e) => e.topic).filter(Boolean) as string[])],
  };
}

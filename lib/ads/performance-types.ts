import type { AdPlatform } from '@/lib/ads/types';
import type { AdType } from '@/lib/ads/ad-draft-types';

export type AIInsightType =
  | 'winner'
  | 'underperformer'
  | 'creative_fatigue'
  | 'budget_reallocation'
  | 'audience_tuning';

export interface AdPerformanceDaily {
  id: string;
  promotion_id: string;
  user_id: string;
  platform: AdPlatform;
  date: string;
  impressions: number;
  clicks: number;
  spend_cents: number;
  leads: number;
  frequency: number | null;
}

export interface AIInsight {
  id: string;
  agentId: string;
  type: AIInsightType;
  message: string;
  suggestedAction: string;
  relatedAdIds: string[];
  adType?: AdType | null;
  platform?: AdPlatform | null;
  metadata?: Record<string, unknown>;
  dismissed: boolean;
  createdAt: string;
}

export interface AdPerformanceSummary {
  promotionId: string;
  platform: AdPlatform;
  adType: AdType | null;
  headline: string | null;
  status: string;
  projectTitle: string | null;
  projectAddress: string | null;
  impressions: number;
  clicks: number;
  ctr: number;
  spendCents: number;
  leads: number;
  costPerLead: number | null;
  avgFrequency: number | null;
  daily: AdPerformanceDaily[];
}

export interface PerformanceDashboardData {
  totals: {
    impressions: number;
    clicks: number;
    ctr: number;
    spendCents: number;
    leads: number;
    costPerLead: number | null;
  };
  ads: AdPerformanceSummary[];
  dateRange: { from: string; to: string };
}

export function ctrPercent(clicks: number, impressions: number): number {
  if (impressions <= 0) return 0;
  return Math.round((clicks / impressions) * 10000) / 100;
}

export function costPerLeadCents(spendCents: number, leads: number): number | null {
  if (leads <= 0) return null;
  return Math.round(spendCents / leads);
}

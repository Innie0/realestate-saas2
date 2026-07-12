import type { Project } from '@/types';

export type AdPlatform = 'google' | 'meta';

export type AdCampaignStatus = 'active' | 'paused' | 'ended' | 'draft';

export interface AdPlatformConnection {
  id: string;
  user_id: string;
  provider: AdPlatform;
  account_id: string | null;
  account_name: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Full row from Supabase — tokens never sent to the client. */
export interface AdPlatformConnectionRow extends AdPlatformConnection {
  access_token: string;
  refresh_token: string | null;
  token_expiry: string | null;
}

export interface AdCampaign {
  id: string;
  platform: AdPlatform;
  name: string;
  status: AdCampaignStatus;
  objective: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  dailyBudget: number | null;
  currency: string;
  externalUrl: string;
}

export interface AdsSummary {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  currency: string;
  connectedPlatforms: AdPlatform[];
}

export type AdPromotionStatus = 'pending' | 'active' | 'paused' | 'ended' | 'failed';

export interface AdPromotion {
  id: string;
  project_id: string;
  platform: AdPlatform;
  daily_budget_cents: number;
  duration_days: number;
  status: AdPromotionStatus;
  headline: string | null;
  primary_text?: string | null;
  ad_type?: string | null;
  meta_ad_id?: string | null;
  landing_url: string;
  created_at: string;
  meta_campaign_id: string | null;
  error_message: string | null;
  projects?: {
    id: string;
    title: string;
    property_info?: { address?: string; city?: string; state?: string; zip_code?: string; price?: number };
    images?: Project['images'];
  } | null;
}

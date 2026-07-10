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

/** Google Ads GAQL reporting — requires developer token + customer id on connection. */
export interface GoogleDailyInsight {
  date: string;
  impressions: number;
  clicks: number;
  spendCents: number;
  frequency: number | null;
  leads: number;
}

export async function fetchGoogleAdDailyInsights(
  _accessToken: string,
  _customerId: string | null,
  _adId: string | null,
  _since: string,
  _until: string
): Promise<GoogleDailyInsight[]> {
  // Live GAQL sync needs GOOGLE_ADS_DEVELOPER_TOKEN and customer id on ad_platform_connections.
  return [];
}

export function isGoogleAdsReportingConfigured(): boolean {
  return Boolean(process.env.GOOGLE_ADS_DEVELOPER_TOKEN);
}

import type {
  AdCampaign,
  AdPlatform,
  AdPlatformConnectionRow,
  AdsSummary,
} from '@/lib/ads/types';

/** Placeholder until Google Ads API + developer token are wired for live sync. */
async function fetchGoogleCampaigns(
  _connection: Pick<AdPlatformConnectionRow, 'access_token' | 'account_id'>
): Promise<AdCampaign[]> {
  return [];
}

async function fetchMetaCampaigns(
  connection: Pick<AdPlatformConnectionRow, 'access_token' | 'account_id'>
): Promise<AdCampaign[]> {
  if (!connection.account_id) return [];

  const accountId = connection.account_id.startsWith('act_')
    ? connection.account_id
    : `act_${connection.account_id}`;

  const fields = 'id,name,status,objective,daily_budget,spend,impressions,clicks,actions';
  const url = `https://graph.facebook.com/v21.0/${accountId}/campaigns?fields=${fields}&access_token=${encodeURIComponent(connection.access_token)}&limit=50`;

  const res = await fetch(url);
  const json = (await res.json()) as {
    data?: Array<{
      id: string;
      name?: string;
      status?: string;
      objective?: string;
      daily_budget?: string;
      spend?: string;
      impressions?: string;
      clicks?: string;
      actions?: Array<{ action_type: string; value: string }>;
    }>;
    error?: { message: string };
  };

  if (!res.ok || json.error) {
    console.warn('Meta campaigns fetch:', json.error?.message);
    return [];
  }

  return (json.data ?? []).map((row) => {
    const conversions =
      row.actions?.find((a) =>
        ['lead', 'offsite_conversion', 'onsite_conversion.lead_grouped'].some((t) =>
          a.action_type.includes(t)
        )
      )?.value ?? '0';

    const statusMap: Record<string, AdCampaign['status']> = {
      ACTIVE: 'active',
      PAUSED: 'paused',
      ARCHIVED: 'ended',
      DELETED: 'ended',
    };

    return {
      id: row.id,
      platform: 'meta' as AdPlatform,
      name: row.name || 'Untitled campaign',
      status: statusMap[row.status ?? ''] ?? 'draft',
      objective: row.objective?.replace(/_/g, ' ') ?? 'Campaign',
      spend: parseFloat(row.spend ?? '0') || 0,
      impressions: parseInt(row.impressions ?? '0', 10) || 0,
      clicks: parseInt(row.clicks ?? '0', 10) || 0,
      conversions: parseInt(conversions, 10) || 0,
      dailyBudget: row.daily_budget ? parseFloat(row.daily_budget) / 100 : null,
      currency: 'USD',
      externalUrl: `https://www.facebook.com/adsmanager/manage/campaigns?act=${accountId.replace('act_', '')}&selected_campaign_ids=${row.id}`,
    };
  });
}

export async function fetchCampaignsForConnections(
  connections: AdPlatformConnectionRow[]
): Promise<AdCampaign[]> {
  const active = connections.filter((c) => c.is_active);
  const batches = await Promise.all(
    active.map(async (conn) => {
      if (conn.provider === 'google') {
        return fetchGoogleCampaigns(conn);
      }
      if (conn.provider === 'meta') {
        return fetchMetaCampaigns(conn);
      }
      return [];
    })
  );
  return batches.flat();
}

export function summarizeCampaigns(
  campaigns: AdCampaign[],
  connectedPlatforms: AdPlatform[]
): AdsSummary {
  return {
    spend: campaigns.reduce((sum, c) => sum + c.spend, 0),
    impressions: campaigns.reduce((sum, c) => sum + c.impressions, 0),
    clicks: campaigns.reduce((sum, c) => sum + c.clicks, 0),
    conversions: campaigns.reduce((sum, c) => sum + c.conversions, 0),
    currency: campaigns[0]?.currency ?? 'USD',
    connectedPlatforms,
  };
}

interface MetaInsightRow {
  date_start?: string;
  impressions?: string;
  clicks?: string;
  spend?: string;
  frequency?: string;
  actions?: Array<{ action_type: string; value: string }>;
}

export interface MetaDailyInsight {
  date: string;
  impressions: number;
  clicks: number;
  spendCents: number;
  frequency: number | null;
  leads: number;
}

function parseLeadsFromActions(actions?: MetaInsightRow['actions']): number {
  if (!actions?.length) return 0;
  let total = 0;
  for (const action of actions) {
    if (
      action.action_type.includes('lead') ||
      action.action_type.includes('offsite_conversion')
    ) {
      total += parseInt(action.value, 10) || 0;
    }
  }
  return total;
}

export async function fetchMetaAdDailyInsights(
  accessToken: string,
  adId: string,
  since: string,
  until: string
): Promise<MetaDailyInsight[]> {
  const fields = 'impressions,clicks,spend,frequency,actions';
  const timeRange = encodeURIComponent(JSON.stringify({ since, until }));
  const url =
    `https://graph.facebook.com/v21.0/${adId}/insights` +
    `?fields=${fields}&time_increment=1&time_range=${timeRange}` +
    `&access_token=${encodeURIComponent(accessToken)}`;

  const res = await fetch(url);
  const json = (await res.json()) as {
    data?: MetaInsightRow[];
    error?: { message?: string };
  };

  if (!res.ok || json.error) {
    throw new Error(json.error?.message || 'Meta insights request failed');
  }

  return (json.data ?? []).map((row) => ({
    date: row.date_start || since,
    impressions: parseInt(row.impressions ?? '0', 10) || 0,
    clicks: parseInt(row.clicks ?? '0', 10) || 0,
    spendCents: Math.round(parseFloat(row.spend ?? '0') * 100),
    frequency: row.frequency ? parseFloat(row.frequency) : null,
    leads: parseLeadsFromActions(row.actions),
  }));
}

export function formatDateYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return formatDateYmd(d);
}

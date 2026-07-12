export type AdUtmPlatform = 'meta' | 'google';

export interface AdUtmParams {
  platform: AdUtmPlatform;
  projectId: string;
  promotionId?: string;
}

export function buildAdLandingUrl(baseUrl: string, params: AdUtmParams): string {
  const url = new URL(baseUrl);
  url.searchParams.set('utm_source', params.platform);
  url.searchParams.set('utm_medium', 'paid');
  url.searchParams.set('utm_campaign', `listing-${params.projectId}`);
  if (params.promotionId) {
    url.searchParams.set('utm_content', params.promotionId);
  }
  return url.toString();
}

export function parseAdAttribution(search: string): {
  adSource: string | null;
  projectId: string | null;
  promotionId: string | null;
} {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const source = params.get('utm_source');
  const medium = params.get('utm_medium');
  const campaign = params.get('utm_campaign') || '';
  const content = params.get('utm_content');

  if (medium !== 'paid' || (source !== 'meta' && source !== 'google')) {
    return { adSource: null, projectId: null, promotionId: null };
  }

  const projectMatch = campaign.match(/^listing-([0-9a-f-]{36})$/i);
  return {
    adSource: `${source}_ad`,
    projectId: projectMatch?.[1] ?? null,
    promotionId: content && /^[0-9a-f-]{36}$/i.test(content) ? content : null,
  };
}

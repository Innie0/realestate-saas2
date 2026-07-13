import type { AdPlatform } from '@/lib/ads/types';

export function getExternalAdsUrl(platform: AdPlatform): string {
  return platform === 'google'
    ? 'https://ads.google.com/aw/campaigns'
    : 'https://www.facebook.com/adsmanager';
}

/** Where users create a new ad account if they only authorized login. */
export function getAdAccountSetupUrl(platform: AdPlatform): string {
  return platform === 'google'
    ? 'https://ads.google.com/signup'
    : 'https://www.facebook.com/adsmanager/manage/accounts';
}

export function getAdAccountSetupLabel(platform: AdPlatform): string {
  return platform === 'google' ? 'Create Google Ads account' : 'Create Meta ad account';
}

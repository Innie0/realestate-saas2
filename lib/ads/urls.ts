import type { AdPlatform } from '@/lib/ads/types';

export function getExternalAdsUrl(platform: AdPlatform): string {
  return platform === 'google'
    ? 'https://ads.google.com/aw/campaigns'
    : 'https://www.facebook.com/adsmanager';
}

import {
  getDraftDestination,
  getEffectiveCopy,
  type AdDraft,
} from '@/lib/ads/ad-draft-types';
import { buildGoogleSearchAdAssets, type GoogleSearchAdAssets } from '@/lib/ads/google-ad-assets';
import { SITE_DOMAIN } from '@/lib/site-config';

function text(value: string | number | undefined): string | null {
  const s = value === undefined || value === null ? '' : String(value).trim();
  return s || null;
}

function num(value: string | number | undefined): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** The Google ad text this draft will produce — the same builder the publish step uses. */
export function googleAssetsFromDraft(draft: AdDraft): GoogleSearchAdAssets {
  const { headline, body } = getEffectiveCopy(draft);
  const d = draft.propertyDetails;
  return buildGoogleSearchAdAssets({
    adType: draft.adType,
    headline,
    body,
    openHouseDate: text(d.openHouseDate),
    listing: {
      address: text(d.address),
      city: text(d.city),
      state: text(d.state),
      zip: text(d.zip),
      price: num(d.price),
      bedrooms: num(d.bedrooms),
      bathrooms: num(d.bathrooms),
    },
  });
}

/** The web address Google shows under the ad. */
export function googleDisplayUrlFromDraft(draft: AdDraft): string {
  const destination = getDraftDestination(draft);
  if (destination.type === 'custom') {
    try {
      return new URL(destination.customUrl.trim()).hostname.replace(/^www\./, '');
    } catch {
      return SITE_DOMAIN;
    }
  }
  return SITE_DOMAIN;
}

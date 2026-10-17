/**
 * Publish a listing ad to Google Ads as a Search campaign with one responsive
 * search ad. Everything is created in a single atomic mutate, so a rejected ad
 * never leaves a half-built campaign in the agent's account.
 */

import {
  MIN_DESCRIPTIONS,
  MIN_HEADLINES,
  type GoogleAdListing,
  type GoogleSearchAdAssets,
  type GoogleSitelink,
} from '@/lib/ads/google-ad-assets';
import {
  GoogleAdsApiError,
  mutateGoogleAds,
  normalizeCustomerId,
  searchGoogleAds,
  suggestGeoTargets,
  type GoogleAdsAuth,
} from '@/lib/ads/google-ads-api';
import type { AudiencePresetId } from '@/lib/ads/promotion-options';

export {
  buildCallouts,
  buildGoogleSearchAdAssets,
  buildNegativeKeywords,
  normalizeUsPhone,
  type GoogleAdListing,
  type GoogleSearchAdAssets,
  type GoogleSitelink,
} from '@/lib/ads/google-ad-assets';

const US_GEO_TARGET = 'geoTargetConstants/2840';
const MIN_RADIUS_MILES = 1;
const MAX_RADIUS_MILES = 50;

/**
 * Where the ad shows. Housing ads may not target by ZIP code or demographics,
 * so the choices are a radius around the home, the city, or the state.
 */
async function buildLocationCriterion(
  preset: AudiencePresetId,
  radiusMiles: number,
  listing: GoogleAdListing,
  auth: GoogleAdsAuth,
): Promise<Record<string, unknown>> {
  const { city, state } = listing;

  if (preset === 'near_home' && city && state) {
    return {
      proximity: {
        address: {
          ...(listing.address ? { streetAddress: listing.address } : {}),
          cityName: city,
          provinceCode: state,
          ...(listing.zip ? { postalCode: listing.zip } : {}),
          countryCode: 'US',
        },
        radius: Math.min(MAX_RADIUS_MILES, Math.max(MIN_RADIUS_MILES, radiusMiles || 15)),
        radiusUnits: 'MILES',
      },
    };
  }

  if (preset !== 'wide' && city) {
    const suggestions = await suggestGeoTargets([state ? `${city}, ${state}` : city], auth).catch(() => []);
    const match = suggestions.find((s) => s.targetType === 'City') ?? suggestions[0];
    if (match) return { location: { geoTargetConstant: match.resourceName } };
  }

  if (state) {
    const suggestions = await suggestGeoTargets([state], auth).catch(() => []);
    const match = suggestions.find((s) => s.targetType === 'State');
    if (match) return { location: { geoTargetConstant: match.resourceName } };
  }

  return { location: { geoTargetConstant: US_GEO_TARGET } };
}

/** Google Ads date-time format, in the ad account's time zone. */
function formatGoogleDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} 23:59:59`;
}

export interface CreateGooglePromotionOptions {
  auth: GoogleAdsAuth;
  customerId: string;
  /** Used to keep campaign and budget names unique in the account */
  promotionId: string;
  campaignName: string;
  dailyBudgetCents: number;
  durationDays: number;
  landingUrl: string;
  assets: GoogleSearchAdAssets;
  audiencePreset: AudiencePresetId;
  radiusMiles: number;
  listing: GoogleAdListing;
  /** Searches the ad must never show for */
  negativeKeywords?: string[];
  /**
   * Extras that make the ad bigger and easier to act on. Google needs at least
   * two sitelinks to show any, and they must be on the same site as the ad.
   */
  extras?: {
    /** 10-digit US number for a tap-to-call button */
    phone?: string | null;
    sitelinks?: GoogleSitelink[];
    callouts?: string[];
  };
  /** Check the campaign with Google without creating anything */
  validateOnly?: boolean;
}

/** Google needs at least this many sitelinks before it will show any. */
const MIN_SITELINKS = 2;

/** Operations that attach a call button, extra links, and highlights to the campaign. */
function buildExtraAssetOperations(
  cid: string,
  campaign: string,
  extras: NonNullable<CreateGooglePromotionOptions['extras']>,
): Record<string, unknown>[] {
  const operations: Record<string, unknown>[] = [];
  let tempId = -100;

  const attach = (asset: Record<string, unknown>, fieldType: 'CALL' | 'SITELINK' | 'CALLOUT') => {
    const resourceName = `customers/${cid}/assets/${tempId--}`;
    operations.push({ assetOperation: { create: { resourceName, ...asset } } });
    operations.push({ campaignAssetOperation: { create: { campaign, asset: resourceName, fieldType } } });
  };

  if (extras.phone) {
    attach({ callAsset: { countryCode: 'US', phoneNumber: extras.phone } }, 'CALL');
  }
  const sitelinks = extras.sitelinks ?? [];
  if (sitelinks.length >= MIN_SITELINKS) {
    for (const link of sitelinks.slice(0, 4)) {
      attach({ sitelinkAsset: { linkText: link.text.slice(0, 25) }, finalUrls: [link.url] }, 'SITELINK');
    }
  }
  for (const text of (extras.callouts ?? []).slice(0, 4)) {
    attach({ calloutAsset: { calloutText: text.slice(0, 25) } }, 'CALLOUT');
  }
  return operations;
}

export async function createGoogleSearchPromotion(
  options: CreateGooglePromotionOptions,
): Promise<{ campaignId: string; adGroupId: string; adId: string }> {
  const { assets } = options;
  if (assets.headlines.length < MIN_HEADLINES || assets.descriptions.length < MIN_DESCRIPTIONS) {
    throw new Error('Not enough ad text for a Google ad. Add a headline and a longer message.');
  }

  const cid = normalizeCustomerId(options.customerId);
  const suffix = options.promotionId.slice(0, 8);
  const name = `${options.campaignName} · ${suffix}`.slice(0, 200);
  const budget = `customers/${cid}/campaignBudgets/-1`;
  const campaign = `customers/${cid}/campaigns/-2`;
  const adGroup = `customers/${cid}/adGroups/-3`;

  const location = await buildLocationCriterion(
    options.audiencePreset,
    options.radiusMiles,
    options.listing,
    options.auth,
  );
  const endsAt = new Date(Date.now() + options.durationDays * 86_400_000);

  const operations: Record<string, unknown>[] = [
    {
      campaignBudgetOperation: {
        create: {
          resourceName: budget,
          name: `${name} · Budget`,
          // Google budgets are in millionths of the account currency
          amountMicros: String(options.dailyBudgetCents * 10_000),
          deliveryMethod: 'STANDARD',
          explicitlyShared: false,
        },
      },
    },
    {
      campaignOperation: {
        create: {
          resourceName: campaign,
          name,
          status: 'ENABLED',
          advertisingChannelType: 'SEARCH',
          campaignBudget: budget,
          // Maximize clicks within the daily budget
          targetSpend: {},
          networkSettings: {
            targetGoogleSearch: true,
            targetSearchNetwork: false,
            targetPartnerSearchNetwork: false,
            targetContentNetwork: false,
          },
          // Only people physically in the area, not people merely interested in it
          geoTargetTypeSetting: { positiveGeoTargetType: 'PRESENCE' },
          containsEuPoliticalAdvertising: 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING',
          endDateTime: formatGoogleDateTime(endsAt),
        },
      },
    },
    { campaignCriterionOperation: { create: { campaign, ...location } } },
    {
      adGroupOperation: {
        create: {
          resourceName: adGroup,
          name: `${name} · Ad group`,
          campaign,
          type: 'SEARCH_STANDARD',
          status: 'ENABLED',
        },
      },
    },
    ...assets.keywords.map((text) => ({
      adGroupCriterionOperation: {
        create: { adGroup, status: 'ENABLED', keyword: { text, matchType: 'PHRASE' } },
      },
    })),
    // Never show for these searches (renters, job seekers, …) so budget goes to real prospects
    ...(options.negativeKeywords ?? []).map((text) => ({
      campaignCriterionOperation: {
        create: { campaign, negative: true, keyword: { text, matchType: 'BROAD' } },
      },
    })),
    {
      adGroupAdOperation: {
        create: {
          adGroup,
          status: 'ENABLED',
          ad: {
            finalUrls: [options.landingUrl],
            responsiveSearchAd: {
              headlines: assets.headlines.map((text) => ({ text })),
              descriptions: assets.descriptions.map((text) => ({ text })),
            },
          },
        },
      },
    },
  ];

  const extraOperations = options.extras
    ? buildExtraAssetOperations(cid, campaign, options.extras)
    : [];

  let resourceNames: string[];
  try {
    ({ resourceNames } = await mutateGoogleAds(cid, [...operations, ...extraOperations], options.auth, {
      validateOnly: options.validateOnly,
    }));
  } catch (err) {
    // The extras are optional — if Google rejects one (say, an unverifiable phone number),
    // publish the ad without them rather than not at all.
    if (!(err instanceof GoogleAdsApiError) || extraOperations.length === 0) throw err;
    console.warn('Google Ads extras rejected, publishing without them:', err.message, err.codes);
    ({ resourceNames } = await mutateGoogleAds(cid, operations, options.auth, {
      validateOnly: options.validateOnly,
    }));
  }

  const idOf = (prefix: string) =>
    resourceNames.find((r) => r.includes(`/${prefix}/`))?.split('/').pop() ?? '';
  return {
    campaignId: idOf('campaigns'),
    adGroupId: idOf('adGroups'),
    // adGroupAds resource names look like customers/1/adGroupAds/{adGroupId}~{adId}
    adId: idOf('adGroupAds').split('~').pop() ?? '',
  };
}

/** Pause or resume a campaign Oikaro created. */
export async function setGoogleCampaignStatus(
  customerId: string,
  campaignId: string,
  status: 'PAUSED' | 'ENABLED',
  auth: GoogleAdsAuth,
): Promise<void> {
  const cid = normalizeCustomerId(customerId);
  await mutateGoogleAds(
    cid,
    [
      {
        campaignOperation: {
          update: { resourceName: `customers/${cid}/campaigns/${campaignId}`, status },
          updateMask: 'status',
        },
      },
    ],
    auth,
  );
}

/** Google's ceiling on a responsive search ad's text. */
const MAX_AD_HEADLINES = 15;
const MAX_AD_DESCRIPTIONS = 4;

/**
 * Add headlines/descriptions to a live ad in place, keeping what's already there,
 * so Google keeps what it has learned instead of starting a new ad from scratch.
 * Returns how many were actually added.
 */
export async function addGoogleAdText(
  customerId: string,
  adId: string,
  additions: { headlines: string[]; descriptions: string[] },
  auth: GoogleAdsAuth,
): Promise<{ addedHeadlines: number; addedDescriptions: number }> {
  const cid = normalizeCustomerId(customerId);
  const rows = await searchGoogleAds<{
    adGroupAd?: { ad?: { responsiveSearchAd?: { headlines?: { text?: string }[]; descriptions?: { text?: string }[] } } };
  }>(
    cid,
    `SELECT ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions
     FROM ad_group_ad WHERE ad_group_ad.ad.id = ${Number(adId)}`,
    auth,
  );
  const rsa = rows[0]?.adGroupAd?.ad?.responsiveSearchAd;
  if (!rsa) throw new Error('Could not find this ad on Google.');

  const merge = (current: { text?: string }[] = [], extra: string[], max: number) => {
    const texts = current.map((t) => t.text ?? '').filter(Boolean);
    const seen = new Set(texts.map((t) => t.toLowerCase()));
    const added = extra.filter((t) => t && !seen.has(t.toLowerCase())).slice(0, Math.max(0, max - texts.length));
    return { all: [...texts, ...added], added: added.length };
  };
  const headlines = merge(rsa.headlines, additions.headlines, MAX_AD_HEADLINES);
  const descriptions = merge(rsa.descriptions, additions.descriptions, MAX_AD_DESCRIPTIONS);
  if (headlines.added + descriptions.added === 0) return { addedHeadlines: 0, addedDescriptions: 0 };

  await mutateGoogleAds(
    cid,
    [
      {
        adOperation: {
          update: {
            resourceName: `customers/${cid}/ads/${adId}`,
            responsiveSearchAd: {
              headlines: headlines.all.map((text) => ({ text })),
              descriptions: descriptions.all.map((text) => ({ text })),
            },
          },
          updateMask: 'responsive_search_ad.headlines,responsive_search_ad.descriptions',
        },
      },
    ],
    auth,
  );
  return { addedHeadlines: headlines.added, addedDescriptions: descriptions.added };
}

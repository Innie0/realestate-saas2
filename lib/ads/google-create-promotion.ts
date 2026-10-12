/**
 * Publish a listing ad to Google Ads as a Search campaign with one responsive
 * search ad. Everything is created in a single atomic mutate, so a rejected ad
 * never leaves a half-built campaign in the agent's account.
 */

import type { AdType } from '@/lib/ads/ad-draft-types';
import {
  mutateGoogleAds,
  normalizeCustomerId,
  suggestGeoTargets,
  type GoogleAdsAuth,
} from '@/lib/ads/google-ads-api';
import type { AudiencePresetId } from '@/lib/ads/promotion-options';

/** Responsive search ad limits set by Google. */
const HEADLINE_MAX_CHARS = 30;
const DESCRIPTION_MAX_CHARS = 90;
const MIN_HEADLINES = 3;
const MAX_HEADLINES = 10;
const MIN_DESCRIPTIONS = 2;
const MAX_DESCRIPTIONS = 4;
const MAX_KEYWORDS = 8;

const US_GEO_TARGET = 'geoTargetConstants/2840';
const MIN_RADIUS_MILES = 1;
const MAX_RADIUS_MILES = 50;

export interface GoogleAdListing {
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
}

export interface GoogleSearchAdAssets {
  headlines: string[];
  descriptions: string[];
  keywords: string[];
}

/** Google rejects decorative symbols and exclamation marks in headlines. */
function cleanAdText(text: string, forHeadline: boolean): string {
  let out = text
    .replace(/[—–]/g, '-')
    .replace(/[·•|]/g, ',')
    .replace(/…/g, '.')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .trim();
  if (forHeadline) out = out.replace(/!/g, '');
  else out = out.replace(/!+/g, '.');
  return out.trim();
}

/** Shorten to a limit without cutting a word in half. */
function fitToLimit(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const lastSpace = cut.lastIndexOf(' ');
  const trimmed = (lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : text.slice(0, max)).trim();
  return trimmed.replace(/[,\-:;]+$/, '').trim();
}

function uniqueByLowercase(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((v) => {
    const key = v.toLowerCase();
    if (!v || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatPrice(price: number | null): string | null {
  return price && price > 0 ? `$${Math.round(price).toLocaleString('en-US')}` : null;
}

const AGENT_AD_TYPES: AdType[] = ['agent_branding', 'market_update', 'testimonial'];

function leadHeadline(adType: AdType | null, city: string | null): string {
  const place = city ? ` in ${city}` : '';
  switch (adType) {
    case 'open_house':
      return `Open House${place}`;
    case 'just_sold':
      return `Just Sold${place}`;
    case 'price_reduced':
      return `Price Reduced${place}`;
    case 'coming_soon':
      return `Coming Soon${place}`;
    case 'agent_branding':
      return city ? `${city} Real Estate Agent` : 'Local Real Estate Agent';
    case 'market_update':
      return city ? `${city} Housing Market Update` : 'Housing Market Update';
    case 'testimonial':
      return city ? `Trusted ${city} Realtor` : 'Trusted Local Realtor';
    default:
      return `Just Listed${place}`;
  }
}

/** Split copy into sentence groups that each fit a description line. */
function packSentences(body: string): string[] {
  const sentences = body.match(/[^.?]+[.?]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [];
  const lines: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length <= DESCRIPTION_MAX_CHARS) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = sentence.length <= DESCRIPTION_MAX_CHARS ? sentence : fitToLimit(sentence, DESCRIPTION_MAX_CHARS);
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Build the ad's headlines, descriptions, and search keywords from the listing and the agent's copy. */
export function buildGoogleSearchAdAssets(input: {
  adType: AdType | null;
  headline: string;
  body: string;
  listing: GoogleAdListing;
}): GoogleSearchAdAssets {
  const { adType, listing } = input;
  const city = listing.city ? cleanAdText(listing.city, true) : null;
  const isAgentAd = adType !== null && AGENT_AD_TYPES.includes(adType);
  const price = formatPrice(listing.price);
  const beds = listing.bedrooms ? `${listing.bedrooms} Bed` : null;
  const baths = listing.bathrooms ? `${listing.bathrooms} Bath` : null;
  const specs = [beds, baths].filter(Boolean).join(', ');

  const headlineCandidates = [
    leadHeadline(adType, city),
    !isAgentAd && specs ? `${specs} Home` : '',
    !isAgentAd && price ? (adType === 'price_reduced' ? `Now ${price}` : `Listed at ${price}`) : '',
    !isAgentAd && listing.address ? listing.address : '',
    input.headline,
    isAgentAd ? 'Free Home Value Estimate' : 'Schedule a Private Showing',
    isAgentAd ? 'Talk to a Local Expert' : 'See Photos and Details',
    city ? `Homes for Sale in ${city}` : 'Homes for Sale Near You',
    isAgentAd ? 'Buying or Selling a Home' : 'Contact the Listing Agent',
  ];
  const headlines = uniqueByLowercase(
    headlineCandidates
      .map((h) => cleanAdText(h, true))
      // A headline cut mid-thought reads badly — only keep ones that fit whole
      .filter((h) => h.length > 0 && h.length <= HEADLINE_MAX_CHARS),
  ).slice(0, MAX_HEADLINES);

  const fallbackDescriptions = isAgentAd
    ? [
        'Local market knowledge and responsive service. Reach out for a free consultation.',
        'Thinking of buying or selling? Get clear answers and a plan that fits your goals.',
      ]
    : [
        'See photos, details, and pricing. Contact the listing agent to schedule a showing.',
        `${specs ? `${specs} home` : 'Home'}${city ? ` in ${city}` : ''}. Request details or book a tour today.`,
      ];
  const descriptions = uniqueByLowercase(
    [...packSentences(cleanAdText(input.body, false)).slice(0, 2), ...fallbackDescriptions]
      .map((d) => fitToLimit(cleanAdText(d, false), DESCRIPTION_MAX_CHARS))
      .filter((d) => d.length >= 20),
  ).slice(0, MAX_DESCRIPTIONS);

  const keywordCandidates = city
    ? isAgentAd
      ? [`realtor ${city}`, `real estate agent ${city}`, `${city} realtor`, `sell my house ${city}`, `${city} real estate`]
      : [
          `homes for sale in ${city}`,
          `houses for sale ${city}`,
          `${city} homes for sale`,
          `${city} real estate`,
          listing.bedrooms ? `${listing.bedrooms} bedroom homes for sale ${city}` : '',
          adType === 'open_house' ? `open houses ${city}` : '',
          `new listings ${city}`,
        ]
    : isAgentAd
      ? ['realtor near me', 'real estate agent near me']
      : ['homes for sale near me', 'houses for sale near me', adType === 'open_house' ? 'open houses near me' : ''];
  const keywords = uniqueByLowercase(
    keywordCandidates.map((k) => k.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()),
  ).slice(0, MAX_KEYWORDS);

  return { headlines, descriptions, keywords };
}

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
  /** Check the campaign with Google without creating anything */
  validateOnly?: boolean;
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

  const { resourceNames } = await mutateGoogleAds(cid, operations, options.auth, {
    validateOnly: options.validateOnly,
  });

  const idOf = (prefix: string) =>
    resourceNames.find((r) => r.includes(`/${prefix}/`))?.split('/').pop() ?? '';
  return {
    campaignId: idOf('campaigns'),
    adGroupId: idOf('adGroups'),
    // adGroupAds resource names look like customers/1/adGroupAds/{adGroupId}~{adId}
    adId: idOf('adGroupAds').split('~').pop() ?? '',
  };
}

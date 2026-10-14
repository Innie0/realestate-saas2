/**
 * Text for a Google responsive search ad, built from a listing and the agent's
 * copy. Pure functions with no API calls, so the ad builder can preview exactly
 * what Google will receive.
 */

import type { AdType } from '@/lib/ads/ad-draft-types';

/** Responsive search ad limits set by Google. */
const HEADLINE_MAX_CHARS = 30;
const DESCRIPTION_MAX_CHARS = 90;
export const MIN_HEADLINES = 3;
const MAX_HEADLINES = 10;
export const MIN_DESCRIPTIONS = 2;
const MAX_DESCRIPTIONS = 4;
const MAX_KEYWORDS = 8;

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

/** "Open House Sat, Oct 18, 1 PM" for an upcoming open house; empty when the date is missing or past. */
function openHouseHeadline(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getTime() < Date.now()) return '';
  const day = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const time = date
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    .replace(':00', '');
  const withTime = `Open House ${day}, ${time}`;
  return withTime.length <= HEADLINE_MAX_CHARS ? withTime : `Open House ${day}`;
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
  /** For open house ads: when it is, e.g. `2026-10-18T13:00` */
  openHouseDate?: string | null;
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
    adType === 'open_house' ? openHouseHeadline(input.openHouseDate) : '',
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
        specs || city
          ? `${specs ? `${specs} home` : 'Home'}${city ? ` in ${city}` : ''}. Request details or book a tour today.`
          : 'Request details or book a private tour today.',
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

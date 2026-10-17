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

/** Ads about the agent rather than one home (home value ads are handled on their own). */
const AGENT_AD_TYPES: AdType[] = ['agent_branding', 'market_update', 'testimonial'];

function leadHeadline(adType: AdType | null, city: string | null): string {
  const place = city ? ` in ${city}` : '';
  switch (adType) {
    case 'home_value':
      return "What's Your Home Worth?";
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

/** Keep headlines that fit whole, dropping duplicates. */
function fitHeadlines(candidates: string[]): string[] {
  return uniqueByLowercase(
    candidates
      .map((h) => cleanAdText(h, true))
      .filter((h) => h.length > 0 && h.length <= HEADLINE_MAX_CHARS),
  ).slice(0, MAX_HEADLINES);
}

function fitDescriptions(body: string, fallbacks: string[]): string[] {
  return uniqueByLowercase(
    [...packSentences(cleanAdText(body, false)).slice(0, 2), ...fallbacks]
      .map((d) => fitToLimit(cleanAdText(d, false), DESCRIPTION_MAX_CHARS))
      .filter((d) => d.length >= 20),
  ).slice(0, MAX_DESCRIPTIONS);
}

function fitKeywords(candidates: string[]): string[] {
  return uniqueByLowercase(
    candidates.map((k) => k.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()),
  ).slice(0, MAX_KEYWORDS);
}

/** Seller-lead ad: homeowners searching what their home is worth. */
function buildHomeValueAssets(headline: string, body: string, city: string | null): GoogleSearchAdAssets {
  return {
    headlines: fitHeadlines([
      "What's Your Home Worth?",
      'Free Home Value Report',
      city ? `${city} Home Values` : 'See Your Home Value',
      headline,
      'Thinking of Selling?',
      "Get Your Home's Value",
      'Based on Recent Local Sales',
      city ? `Sell Your ${city} Home` : 'Sell Your Home',
      'No Obligation',
      'Talk to a Local Agent',
    ]),
    descriptions: fitDescriptions(body, [
      'Find out what your home could sell for, based on recent sales near you.',
      'Request your free home value report. No obligation. A local agent will follow up.',
      city ? `Thinking of selling in ${city}? Get a clear price range and a plan.` : '',
    ]),
    keywords: fitKeywords(
      city
        ? [
            `what is my home worth ${city}`,
            `how much is my house worth ${city}`,
            `home value ${city}`,
            `${city} home values`,
            `home valuation ${city}`,
            `sell my house ${city}`,
            `${city} home prices`,
          ]
        : ['what is my home worth', 'how much is my house worth', 'home value estimate', 'sell my house'],
    ),
  };
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
  if (adType === 'home_value') return buildHomeValueAssets(input.headline, input.body, city);
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

const AGENT_AD_TYPE_SET = new Set<AdType>(AGENT_AD_TYPES);

/** Searches that are never a home buyer or seller looking for an agent. */
const ALWAYS_EXCLUDED = [
  // Jobs and training
  'jobs', 'job', 'salary', 'career', 'careers', 'hiring', 'license', 'course', 'courses', 'school', 'class', 'classes', 'exam',
  // Looking for the big portals by name
  'zillow', 'redfin', 'trulia', 'realtor.com',
  // Free / research-only intent
  'free', 'wallpaper', 'game', 'meme',
];

/** Extra exclusions for ads selling a home: renters and bargain hunters won't buy it. */
const LISTING_EXCLUDED = [
  'rent', 'rental', 'rentals', 'renting', 'lease', 'apartment', 'apartments', 'roommate',
  'foreclosure', 'foreclosures', 'auction', 'cheap', 'section 8', 'timeshare',
];

/**
 * Search terms the ad should never show for, so the budget isn't spent on
 * people who were never going to become a client.
 */
export function buildNegativeKeywords(adType: AdType | null): string[] {
  const isAgentAd = adType !== null && (AGENT_AD_TYPE_SET.has(adType) || adType === 'home_value');
  return isAgentAd ? [...ALWAYS_EXCLUDED, 'rent', 'rental', 'apartment'] : [...ALWAYS_EXCLUDED, ...LISTING_EXCLUDED];
}

/** Short highlights shown under the ad (Google limit: 25 characters each). */
export function buildCallouts(adType: AdType | null): string[] {
  if (adType === 'home_value') {
    return ['Free Home Value Report', 'No Obligation', 'Based on Recent Sales', 'Licensed Agent'];
  }
  const isAgentAd = adType !== null && AGENT_AD_TYPE_SET.has(adType);
  return isAgentAd
    ? ['Licensed Agent', 'Free Consultation', 'Buyers and Sellers', 'Local Area Knowledge']
    : ['Licensed Agent', 'Private Showings', 'Ask About This Home', 'Local Area Knowledge'];
}

/** A US phone number as 10 digits for a call button, or null if it isn't one. */
export function normalizeUsPhone(phone: string | null | undefined): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  // Area codes and exchanges can't start with 0 or 1
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(ten) ? ten : null;
}

/** An extra link shown under the ad (Google limit: 25 characters of text). */
export interface GoogleSitelink {
  text: string;
  url: string;
}

/**
 * The ad playbook: which ad types agents can run, what each one is for, and the
 * platform it works on. Each type is offered only where it tends to pay off:
 *
 * - Google Search reaches people actively searching, so it carries ads people
 *   search for — "what's my home worth", "realtor in <city>".
 * - Facebook & Instagram reach people scrolling, so they carry photo-led listing
 *   ads that nobody searches for by name.
 */

import { Calendar, Home, Sparkles, Tag, User, Calculator, Lightbulb, type LucideIcon } from 'lucide-react';
import type { AdType } from '@/lib/ads/ad-draft-types';
import type { AdPlatform } from '@/lib/ads/types';

export interface AdTypeOption {
  id: AdType;
  label: string;
  description: string;
  icon: LucideIcon;
  /** What the ad brings in, shown to the agent */
  goal: string;
  /** Platforms this ad type is offered on, best first */
  platforms: AdPlatform[];
  /** Highlighted as the best place to start */
  recommended?: boolean;
  /** Below this, an ad rarely gets enough clicks to judge */
  minDailyCents: number;
  suggestedDailyCents: number;
  suggestedDays: number;
  /** One line of advice for getting results from this ad type */
  tip: string;
}

/** Ad types offered in the builder, in the order shown. */
export const AD_TYPE_OPTIONS: AdTypeOption[] = [
  {
    id: 'home_value',
    label: 'What’s your home worth?',
    description: 'Homeowners request a free home value report',
    icon: Calculator,
    goal: 'Seller leads',
    platforms: ['google', 'meta'],
    recommended: true,
    minDailyCents: 1500,
    suggestedDailyCents: 2000,
    suggestedDays: 30,
    tip: 'Homeowners search for this, and each lead is a possible listing. Send the value report quickly.',
  },
  {
    id: 'agent_branding',
    label: 'Meet the agent',
    description: 'Show up when people search for an agent near them',
    icon: User,
    goal: 'New clients',
    platforms: ['google', 'meta'],
    minDailyCents: 1500,
    suggestedDailyCents: 2000,
    suggestedDays: 30,
    tip: 'Add a client review in your own words with their permission — it builds trust fast.',
  },
  {
    id: 'new_listing',
    label: 'Just listed',
    description: 'Show a new listing to buyers nearby',
    icon: Home,
    goal: 'Buyer leads',
    platforms: ['meta'],
    minDailyCents: 1000,
    suggestedDailyCents: 1500,
    suggestedDays: 14,
    tip: 'Listing ads work as photo ads on Facebook & Instagram — few people search Google for one house.',
  },
  {
    id: 'open_house',
    label: 'Open house',
    description: 'Get more people through the door',
    icon: Calendar,
    goal: 'Visitors',
    platforms: ['meta'],
    minDailyCents: 1000,
    suggestedDailyCents: 2000,
    suggestedDays: 7,
    tip: 'Start the ad 5–7 days before the open house so people can plan to come.',
  },
  {
    id: 'price_reduced',
    label: 'Price reduced',
    description: 'Bring buyers back after a price drop',
    icon: Tag,
    goal: 'Buyer leads',
    platforms: ['meta'],
    minDailyCents: 1000,
    suggestedDailyCents: 1500,
    suggestedDays: 14,
    tip: 'Lead with the new price — it’s the reason to look again.',
  },
  {
    id: 'just_sold',
    label: 'Just sold',
    description: 'Show neighbors you sell homes like theirs',
    icon: Sparkles,
    goal: 'Seller leads',
    platforms: ['meta'],
    minDailyCents: 1000,
    suggestedDailyCents: 1500,
    suggestedDays: 14,
    tip: 'Aim it near the sold home — neighbors are the likeliest next sellers.',
  },
  {
    id: 'custom',
    label: 'Your own idea',
    description: 'Describe any ad — AI reviews it before you spend',
    icon: Lightbulb,
    goal: 'Your goal',
    platforms: ['google', 'meta'],
    minDailyCents: 1000,
    suggestedDailyCents: 1500,
    suggestedDays: 14,
    tip: 'The AI review tells you whether the idea is likely to pay off and where it should run.',
  },
];

/** Types no longer offered, kept so older ads still show a readable name. */
const RETIRED_AD_TYPE_LABELS: Partial<Record<AdType, string>> = {
  coming_soon: 'Coming soon',
  testimonial: 'Testimonial',
  market_update: 'Market update',
};

export function getAdTypeOption(adType: AdType | null): AdTypeOption | undefined {
  return adType ? AD_TYPE_OPTIONS.find((o) => o.id === adType) : undefined;
}

/** Whether the builder offers this ad type on this platform. */
export function isPlatformAllowedForAdType(
  adType: AdType | null,
  platform: AdPlatform,
  available: Record<AdPlatform, boolean> = PLATFORM_AVAILABLE,
): boolean {
  const option = getAdTypeOption(adType);
  return option ? option.platforms.includes(platform) && available[platform] : false;
}

/**
 * Platforms agents can publish to today. Facebook & Instagram is "coming soon"
 * until Meta approves Oikaro's app — flip `meta` to true to bring it back
 * everywhere (connect button, builder, publishing).
 */
export const PLATFORM_AVAILABLE: Record<AdPlatform, boolean> = {
  google: true,
  meta: false,
};

/**
 * Accounts that see "coming soon" platforms switched on, to test the flow and
 * record Meta's App Review screencast before launch.
 */
const PLATFORM_PREVIEW_EMAILS = ['builtbyalia@gmail.com', 'callon786@outlook.com'];

/** Platforms this account can use — for server checks, which must not rely on browser state. */
export function platformsAvailableFor(email: string | null | undefined): Record<AdPlatform, boolean> {
  const preview = !!email && PLATFORM_PREVIEW_EMAILS.includes(email.toLowerCase());
  return { google: PLATFORM_AVAILABLE.google, meta: PLATFORM_AVAILABLE.meta || preview };
}

/**
 * Browser only: switch on preview platforms for the signed-in tester so every
 * ads component (which reads PLATFORM_AVAILABLE) shows them. Never call on the
 * server — the module is shared between users there.
 */
export function applyPlatformPreview(email: string | null | undefined): boolean {
  if (typeof window === 'undefined') return false;
  const available = platformsAvailableFor(email);
  const changed = available.meta !== PLATFORM_AVAILABLE.meta;
  Object.assign(PLATFORM_AVAILABLE, available);
  return changed;
}

export const PLATFORM_NAMES: Record<AdPlatform, string> = {
  google: 'Google',
  meta: 'Facebook & Instagram',
};

export interface DetailField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'datetime-local' | 'textarea';
  placeholder?: string;
}

export function getDetailFieldsForAdType(adType: AdType | null): DetailField[] {
  switch (adType) {
    case 'home_value':
      return [
        { key: 'city', label: 'City you serve', type: 'text', placeholder: 'Visalia' },
        { key: 'state', label: 'State', type: 'text', placeholder: 'CA' },
      ];
    case 'agent_branding':
      return [
        { key: 'city', label: 'City you serve', type: 'text', placeholder: 'Visalia' },
        { key: 'state', label: 'State', type: 'text', placeholder: 'CA' },
        { key: 'agentTagline', label: 'Headline / tagline', type: 'text', placeholder: 'Your local expert in…' },
        { key: 'bioBlurb', label: 'Short bio', type: 'textarea', placeholder: '2–3 sentences about you' },
        {
          key: 'clientReview',
          label: 'Client review (optional — only with their permission)',
          type: 'textarea',
          placeholder: '“Ali made selling our home easy…”',
        },
      ];
    case 'open_house':
      return [
        { key: 'openHouseDate', label: 'Open house date & time', type: 'datetime-local' },
        { key: 'address', label: 'Address', type: 'text', placeholder: '123 Main St' },
        { key: 'city', label: 'City', type: 'text' },
        { key: 'price', label: 'List price', type: 'number' },
      ];
    case 'just_sold':
    case 'price_reduced':
    case 'new_listing':
    default:
      return [
        { key: 'address', label: 'Address', type: 'text' },
        { key: 'city', label: 'City', type: 'text' },
        { key: 'price', label: 'Price', type: 'number' },
        { key: 'bedrooms', label: 'Beds', type: 'number' },
        { key: 'bathrooms', label: 'Baths', type: 'number' },
      ];
  }
}

export function getDefaultCtaForAdType(adType: AdType | null): 'LEARN_MORE' | 'CONTACT_US' | 'GET_QUOTE' {
  switch (adType) {
    case 'open_house':
      return 'GET_QUOTE';
    case 'agent_branding':
    case 'home_value':
    case 'custom':
    case 'testimonial':
      return 'CONTACT_US';
    default:
      return 'LEARN_MORE';
  }
}

export function getAdTypeLabel(adType: AdType): string {
  return getAdTypeOption(adType)?.label ?? RETIRED_AD_TYPE_LABELS[adType] ?? adType;
}

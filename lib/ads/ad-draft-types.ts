import type { AdCtaType, AudiencePresetId } from '@/lib/ads/promotion-options';
import type { AdPlatform } from '@/lib/ads/types';

export type AdType =
  | 'new_listing'
  | 'open_house'
  | 'just_sold'
  | 'price_reduced'
  | 'agent_branding'
  | 'market_update'
  | 'testimonial'
  | 'coming_soon';

export type AdTemplateId = 'clean_minimal' | 'bold_photo' | 'luxury';

export type WizardStepKey = 'type' | 'details' | 'copy' | 'platform' | 'audience' | 'review';

export interface AdCopyVariant {
  headline: string;
  body: string;
  selected: boolean;
}

export interface AdDraftImage {
  url: string;
  order: number;
}

/**
 * Where someone lands after clicking the ad:
 * - `lead_form`  the agent's Oikaro contact form
 * - `custom`     a link the agent pastes (the listing on Zillow/Redfin, their website, …)
 * - `profile`    the agent's public Oikaro profile page
 * - `open_house` the sign-in page for one of their open houses
 */
export type AdDestinationType = 'lead_form' | 'custom' | 'profile' | 'open_house';

export interface AdDestination {
  type: AdDestinationType;
  /** The pasted link when type is `custom` */
  customUrl: string;
  /** The chosen open house when type is `open_house` */
  openHouseId?: string | null;
  /** True once the agent picks a destination themselves, so defaults stop applying */
  touched?: boolean;
}

export const DEFAULT_AD_DESTINATION: AdDestination = { type: 'lead_form', customUrl: '' };

const THIRD_PARTY_LISTING_SITES = ['zillow.com', 'redfin.com', 'realtor.com', 'trulia.com', 'homes.com'];

/** Listing portals that show buyers other agents alongside the listing. */
export function isThirdPartyListingSite(url: string): boolean {
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    return THIRD_PARTY_LISTING_SITES.some((site) => host === site || host.endsWith(`.${site}`));
  } catch {
    return false;
  }
}

const AGENT_FOCUSED_AD_TYPES: AdType[] = ['agent_branding', 'market_update', 'testimonial', 'just_sold'];

/** The destination that best fits an ad type, given what the agent has set up. */
export function recommendedDestinationType(
  adType: AdType | null,
  available: { profileEnabled: boolean; hasOpenHouse: boolean; hasListingLink: boolean },
): AdDestinationType {
  if (adType === 'open_house' && available.hasOpenHouse) return 'open_house';
  if (adType && AGENT_FOCUSED_AD_TYPES.includes(adType)) {
    return available.profileEnabled ? 'profile' : 'lead_form';
  }
  if (adType && available.hasListingLink) return 'custom';
  return 'lead_form';
}

/** Drafts saved before destinations existed have none. */
export function getDraftDestination(draft: { destination?: AdDestination }): AdDestination {
  return draft.destination ?? DEFAULT_AD_DESTINATION;
}

/** A custom destination must be a full https:// (or http://) web address. */
export function isValidDestinationUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

export interface AdDraft {
  id: string;
  adType: AdType | null;
  platforms: AdPlatform[];
  projectId: string | null;
  propertyDetails: Record<string, string | number>;
  images: AdDraftImage[];
  copyVariants: AdCopyVariant[];
  customHeadline: string;
  customBody: string;
  templateId: AdTemplateId;
  audience: {
    preset: AudiencePresetId;
    radiusMiles: number;
    ageMin: number;
    ageMax: number;
    interests: string[];
  };
  budget: {
    dailyAmountCents: number;
    durationDays: number;
  };
  cta: AdCtaType;
  destination?: AdDestination;
  status: 'draft' | 'ready' | 'published';
  createdAt: string;
  updatedAt: string;
}

export const WIZARD_STEPS: { key: WizardStepKey; label: string; short: string }[] = [
  { key: 'type', label: 'Choose ad type', short: 'Type' },
  { key: 'details', label: 'Details & images', short: 'Details' },
  { key: 'copy', label: 'Ad copy', short: 'Copy' },
  { key: 'platform', label: 'Platform & look', short: 'Platform' },
  { key: 'audience', label: 'Audience & budget', short: 'Budget' },
  { key: 'review', label: 'Review & launch', short: 'Launch' },
];

export const AD_TEMPLATES: { id: AdTemplateId; label: string; description: string }[] = [
  { id: 'clean_minimal', label: 'Clean & minimal', description: 'Simple layout, focus on the photo' },
  { id: 'bold_photo', label: 'Bold photo', description: 'Large image, short punchy copy' },
  { id: 'luxury', label: 'Luxury', description: 'Refined tone for high-end listings' },
];

export function createEmptyDraft(id?: string): AdDraft {
  return {
    id: id ?? crypto.randomUUID(),
    adType: null,
    platforms: ['google'],
    projectId: null,
    propertyDetails: {},
    images: [],
    copyVariants: [],
    customHeadline: '',
    customBody: '',
    templateId: 'clean_minimal',
    audience: {
      preset: 'near_home',
      radiusMiles: 15,
      ageMin: 25,
      ageMax: 65,
      interests: [],
    },
    budget: {
      dailyAmountCents: 2000,
      durationDays: 7,
    },
    cta: 'LEARN_MORE',
    destination: { ...DEFAULT_AD_DESTINATION },
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function getEffectiveCopy(draft: AdDraft): { headline: string; body: string } {
  const selected = draft.copyVariants.find((v) => v.selected);
  if (selected?.headline || selected?.body) {
    return {
      headline: draft.customHeadline.trim() || selected.headline,
      body: draft.customBody.trim() || selected.body,
    };
  }
  return {
    headline: draft.customHeadline.trim(),
    body: draft.customBody.trim(),
  };
}

export function getPrimaryImage(draft: AdDraft): string | null {
  const sorted = [...draft.images].sort((a, b) => a.order - b.order);
  return sorted[0]?.url ?? null;
}

export function listingRequiredForAdType(adType: AdType | null): boolean {
  if (!adType) return false;
  return !['agent_branding', 'market_update', 'testimonial'].includes(adType);
}

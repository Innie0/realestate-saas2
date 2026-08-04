import { SITE_NAME } from '@/lib/site-config';

export type IntegrationLogoId = 'google-calendar' | 'google-ads' | 'meta-ads' | 'resend' | 'lead-forms';

export type IntegrationCategoryId = 'scheduling' | 'advertising' | 'lead-capture' | 'email';

export type IntegrationCategory = {
  id: IntegrationCategoryId;
  label: string;
};

/** Display order for category sections on /integrations — Pitch-style grouped grid. */
export const INTEGRATION_CATEGORIES: IntegrationCategory[] = [
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'advertising', label: 'Advertising' },
  { id: 'lead-capture', label: 'Lead capture' },
  { id: 'email', label: 'Email' },
];

export type Integration = {
  slug: string;
  name: string;
  logo: IntegrationLogoId;
  category: IntegrationCategoryId;
  /** One-line summary shown on the integration card. */
  summary: string;
  /** Longer copy shown on the integration detail page. */
  description: string;
};

/**
 * Our actual, shipped integrations — keep this list honest.
 * Add an entry here (and a matching case in IntegrationLogos.tsx if it needs a new logo)
 * whenever a new integration ships; don't add placeholders for things we don't support yet.
 */
export const INTEGRATIONS: Integration[] = [
  {
    slug: 'google-calendar',
    name: 'Google Calendar',
    logo: 'google-calendar',
    category: 'scheduling',
    summary: 'Sync appointments and showings directly to your calendar.',
    description: `Connect your Google account once and every showing, closing, and follow-up you schedule in ${SITE_NAME} syncs straight to Google Calendar — no double entry, no missed appointments.`,
  },
  {
    slug: 'google-ads',
    name: 'Google Ads',
    logo: 'google-ads',
    category: 'advertising',
    summary: 'Manage and run Google ad campaigns without leaving Oikaro.',
    description: `Connect your Google Ads account to launch and manage search and display campaigns for your listings directly from ${SITE_NAME} — no separate dashboard to juggle.`,
  },
  {
    slug: 'meta-ads',
    name: 'Meta Ads',
    logo: 'meta-ads',
    category: 'advertising',
    summary: 'Manage Facebook and Instagram ad campaigns from the dashboard.',
    description: `Connect your Meta Ads account to run Facebook and Instagram campaigns for your listings and open houses — built, launched, and tracked from your ${SITE_NAME} dashboard.`,
  },
  {
    slug: 'resend',
    name: 'Resend',
    logo: 'resend',
    category: 'email',
    summary: 'Automatic email follow-up for new leads.',
    description: `${SITE_NAME} uses Resend under the hood to send scored follow-up sequences the moment a new lead comes in — hot, warm, or cold — so no inquiry goes quiet.`,
  },
  {
    slug: 'lead-capture',
    name: 'Lead capture',
    logo: 'lead-forms',
    category: 'lead-capture',
    summary: 'Capture leads straight into your CRM with a QR code and web forms.',
    description: `Share your personal lead capture link or QR code anywhere — open house flyers, your bio, an email signature — and every submission lands directly in your ${SITE_NAME} CRM, scored and ready to follow up.`,
  },
];

export function getIntegrationBySlug(slug: string): Integration | undefined {
  return INTEGRATIONS.find((integration) => integration.slug === slug);
}

export function getAllIntegrationSlugs(): string[] {
  return INTEGRATIONS.map((integration) => integration.slug);
}

export function getIntegrationsByCategory(categoryId: IntegrationCategoryId): Integration[] {
  return INTEGRATIONS.filter((integration) => integration.category === categoryId);
}

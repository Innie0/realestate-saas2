export const AUDIENCE_PRESETS = [
  {
    id: 'near_home',
    label: 'Near the home',
    description: 'People close to the listing',
  },
  {
    id: 'city',
    label: 'Whole city',
    description: 'Broader reach in the same city',
  },
  {
    id: 'wide',
    label: 'Wide reach',
    description: 'Regional / out-of-area buyers',
  },
] as const;

export type AudiencePresetId = (typeof AUDIENCE_PRESETS)[number]['id'];

export const CTA_OPTIONS = [
  { id: 'LEARN_MORE', label: 'Learn more' },
  { id: 'CONTACT_US', label: 'Contact agent' },
  { id: 'GET_QUOTE', label: 'Schedule tour' },
] as const;

export type AdCtaType = (typeof CTA_OPTIONS)[number]['id'];

export const BUDGET_PRESETS_CENTS = [1000, 1500, 2000, 3000, 5000] as const;

export const DURATION_OPTIONS = [
  { days: 7, label: '1 week' },
  { days: 14, label: '2 weeks' },
  { days: 30, label: '1 month' },
] as const;

export const MIN_DAILY_BUDGET_CENTS = 500;
export const MAX_DAILY_BUDGET_CENTS = 20000;

export function isValidDailyBudget(cents: number): boolean {
  return (
    Number.isInteger(cents) &&
    cents >= MIN_DAILY_BUDGET_CENTS &&
    cents <= MAX_DAILY_BUDGET_CENTS
  );
}

export function isValidDuration(days: number): boolean {
  return DURATION_OPTIONS.some((o) => o.days === days);
}

export function getCtaLabel(cta: AdCtaType): string {
  return CTA_OPTIONS.find((o) => o.id === cta)?.label ?? 'Learn more';
}

export function getAudienceLabel(preset: AudiencePresetId): string {
  return AUDIENCE_PRESETS.find((o) => o.id === preset)?.label ?? 'Near the home';
}

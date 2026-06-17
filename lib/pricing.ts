/**
 * Single source of truth for plan pricing display and Stripe price IDs.
 * Create matching recurring prices in Stripe Dashboard, then set env vars.
 */

export type PlanSlug = 'starter' | 'pro';
export type BillingInterval = 'monthly' | 'annual';

export const STARTER_MONTHLY_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_1Sw9B7Enz9g2d62xiHw3wYn5';
export const PRO_MONTHLY_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_1Sw9MdEnz9g2d62xlyjilIoq';
export const STARTER_ANNUAL_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_STARTER_ANNUAL_PRICE_ID || '';
export const PRO_ANNUAL_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID || '';

export const PLAN_PRICES = {
  starter: { monthly: 49, annual: 490 },
  pro: { monthly: 99, annual: 990 },
} as const;

export const STARTER_FEATURES = [
  '7-day free trial',
  '20 AI Listing Projects per Month',
  '20 Property Lookups per Month',
  '75 AI Assistant Messages per Month',
  'Up to 50 Clients',
  'Up to 20 Transactions',
  'Lead Capture Form & QR Code',
  'Automated Lead Follow-Up Emails',
  'Calendar Integration (Unlimited Events)',
  'AI-Powered Descriptions',
  'Email Support',
] as const;

export const PRO_FEATURES = [
  '7-day free trial',
  'Unlimited Property Listings',
  'Unlimited Property Lookups',
  'Unlimited AI Assistant Messages',
  'Unlimited Clients & Transactions',
  'Lead Capture, Open Houses & Agent Profile',
  'Automated Lead Follow-Up Emails',
  'Unlimited Calendar Events',
  'AI-Powered Descriptions (3 Tones)',
  'Transaction Checklists & Reminders',
  'Priority Support',
] as const;

export const ALL_STARTER_PRICE_IDS = [
  STARTER_MONTHLY_PRICE_ID,
  STARTER_ANNUAL_PRICE_ID,
  'starter',
].filter(Boolean);

export const ALL_PRO_PRICE_IDS = [
  PRO_MONTHLY_PRICE_ID,
  PRO_ANNUAL_PRICE_ID,
  'pro',
].filter(Boolean);

export function formatPlanPrice(amount: number): string {
  return `$${amount}`;
}

export function getStripePriceId(plan: PlanSlug, interval: BillingInterval): string {
  if (plan === 'starter') {
    return interval === 'annual' && STARTER_ANNUAL_PRICE_ID
      ? STARTER_ANNUAL_PRICE_ID
      : STARTER_MONTHLY_PRICE_ID;
  }
  return interval === 'annual' && PRO_ANNUAL_PRICE_ID
    ? PRO_ANNUAL_PRICE_ID
    : PRO_MONTHLY_PRICE_ID;
}

export function isAnnualBillingAvailable(plan: PlanSlug): boolean {
  return plan === 'starter' ? !!STARTER_ANNUAL_PRICE_ID : !!PRO_ANNUAL_PRICE_ID;
}

export function isAnyAnnualBillingAvailable(): boolean {
  return !!STARTER_ANNUAL_PRICE_ID || !!PRO_ANNUAL_PRICE_ID;
}

/** All configured Stripe price IDs accepted at checkout. */
export function getValidCheckoutPriceIds(): string[] {
  return [
    STARTER_MONTHLY_PRICE_ID,
    PRO_MONTHLY_PRICE_ID,
    STARTER_ANNUAL_PRICE_ID,
    PRO_ANNUAL_PRICE_ID,
  ].filter(Boolean);
}

export function isValidCheckoutPriceId(priceId: string | null | undefined): boolean {
  if (!priceId) return false;
  return getValidCheckoutPriceIds().includes(priceId);
}

export function isStarterPriceId(priceId: string | null | undefined): boolean {
  if (!priceId) return false;
  return ALL_STARTER_PRICE_IDS.includes(priceId);
}

export function isProPriceId(priceId: string | null | undefined): boolean {
  if (!priceId) return false;
  return ALL_PRO_PRICE_IDS.includes(priceId);
}

export function getPlanDisplayPrice(plan: PlanSlug, interval: BillingInterval): string {
  const amount = PLAN_PRICES[plan][interval];
  return formatPlanPrice(amount);
}

export function getPlanPeriodLabel(interval: BillingInterval): string {
  return interval === 'annual' ? 'per year after trial' : 'per month after trial';
}

export function getAnnualSavings(plan: PlanSlug): number {
  const monthlyTotal = PLAN_PRICES[plan].monthly * 12;
  return monthlyTotal - PLAN_PRICES[plan].annual;
}

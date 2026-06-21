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

export const STARTER_PLAN_DESCRIPTION = 'Perfect for active agents growing their business';
export const PRO_PLAN_DESCRIPTION = 'Everything you need to scale your real estate business';

export const STARTER_FEATURES = [
  '7-day free trial',
  '20 AI Listing Projects per Month',
  '20 Property Research Lookups per Month',
  '5 CMA / Market Analyses per Month',
  '75 AI Assistant Messages per Month',
  'Up to 50 Clients (total)',
  '20 Transactions per Month',
  'Client Manager (CRM)',
  'Leads Inbox & Hot/Warm/Cold Scoring',
  'Lead Capture Form & QR Code',
  'Automated Lead Follow-Up Emails',
  'Google Calendar & Task Manager',
  'Transaction Checklists, Reminders & Documents',
  'AI Listing Descriptions (3 Tones)',
  'Email Support',
] as const;

export const PRO_PLAN_INTRO = 'Everything in Starter, plus:';

/** Features only on Pro — shown after PRO_PLAN_INTRO on pricing cards. */
export const PRO_EXCLUSIVE_FEATURES = [
  'Unlimited Listing Projects, Property Research, CMA, AI Messages, Clients & Transactions',
  'Open House QR Sign-In',
  'Public Agent Profile Page',
  'Priority Support',
] as const;

/** @deprecated Use PRO_PLAN_INTRO + PRO_EXCLUSIVE_FEATURES for Pro plan cards */
export const PRO_FEATURES = [
  '7-day free trial',
  PRO_PLAN_INTRO,
  ...PRO_EXCLUSIVE_FEATURES,
] as const;

/** Short comparison rows for upgrade page — numeric limits + Pro-only features. */
export const PLAN_COMPARISON_ROWS = [
  { label: 'Listing Projects', starter: '20 / mo', pro: 'Unlimited' },
  { label: 'Property Research', starter: '20 / mo', pro: 'Unlimited' },
  { label: 'CMA / Market Analysis', starter: '5 / mo', pro: 'Unlimited' },
  { label: 'AI Messages', starter: '75 / mo', pro: 'Unlimited' },
  { label: 'Clients', starter: '50 total', pro: 'Unlimited' },
  { label: 'Transactions', starter: '20 / mo', pro: 'Unlimited' },
  { label: 'Calendar & Tasks', starter: true, pro: true },
  { label: 'Lead Capture Form', starter: true, pro: true },
  { label: 'Leads Inbox', starter: true, pro: true },
  { label: 'Open House Sign-In', starter: false, pro: true },
  { label: 'Public Agent Profile', starter: false, pro: true },
  { label: 'Priority Support', starter: false, pro: true },
] as const;

export function getPricingFootnote(): string {
  const base = '7-day free trial · Cancel anytime';
  if (isAnyAnnualBillingAvailable()) {
    return `${base} · Starter ${formatPlanPrice(PLAN_PRICES.starter.annual)}/yr · Pro ${formatPlanPrice(PLAN_PRICES.pro.annual)}/yr (save 2 months)`;
  }
  return `${base} · Billed monthly after trial`;
}

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

/** Pro price that matches the customer's current Starter billing interval. */
export function getUpgradeProPriceId(currentPlanPriceId: string | null | undefined): string {
  if (
    currentPlanPriceId === STARTER_ANNUAL_PRICE_ID &&
    PRO_ANNUAL_PRICE_ID
  ) {
    return PRO_ANNUAL_PRICE_ID;
  }
  return PRO_MONTHLY_PRICE_ID;
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

/** Marketing copy for Starter vs Pro (monthly + annual when configured). */
export function getStarterProComparisonAnswer(): string {
  const starterPrice = isAnyAnnualBillingAvailable()
    ? `Starter (${getPlanDisplayPrice('starter', 'monthly')}/month or ${getPlanDisplayPrice('starter', 'annual')}/year)`
    : `Starter (${getPlanDisplayPrice('starter', 'monthly')}/month)`;
  const proPrice = isAnyAnnualBillingAvailable()
    ? `Pro (${getPlanDisplayPrice('pro', 'monthly')}/month or ${getPlanDisplayPrice('pro', 'annual')}/year)`
    : `Pro (${getPlanDisplayPrice('pro', 'monthly')}/month)`;

  return `${starterPrice} includes 20 listing projects, 20 property research lookups, 5 CMA analyses, 75 AI messages, and 20 transactions per month, plus up to 50 clients total — with lead capture, CRM, leads inbox, automated follow-up emails, calendar, tasks, and transaction checklists. ${proPrice} includes everything in Starter with unlimited usage, plus open house QR sign-in, a public agent profile page, and priority support. Both plans include a 7-day free trial.`;
}

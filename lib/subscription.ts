/**
 * Subscription helpers — hard paywall: only trialing/active paid plans get app access.
 */

import {
  STARTER_MONTHLY_PRICE_ID,
  PRO_MONTHLY_PRICE_ID,
  isProPriceId,
  isStarterPriceId,
} from '@/lib/pricing';

export const ADMIN_EMAIL = 'callon786@outlook.com';

// Free Pro accounts — full Pro access, no subscription required
const FREE_PRO_EMAILS = ['aliq@theagencyre.com', 'realesticai@gmail.com'];

/** @deprecated Use STARTER_MONTHLY_PRICE_ID from lib/pricing */
export const STARTER_PRICE_ID = STARTER_MONTHLY_PRICE_ID;
/** @deprecated Use PRO_MONTHLY_PRICE_ID from lib/pricing */
export const PRO_PRICE_ID = PRO_MONTHLY_PRICE_ID;

export type PaidPlanName = 'starter' | 'pro';

export function isAdminEmail(email: string | undefined | null): boolean {
  return email === ADMIN_EMAIL;
}

export function isFreePro(email: string | undefined | null): boolean {
  if (!email) return false;
  return FREE_PRO_EMAILS.includes(email.toLowerCase());
}

/** User can use the dashboard and APIs */
export function hasAppAccess(
  subscriptionStatus: string | null | undefined,
  email?: string | null
): boolean {
  if (email && (isAdminEmail(email) || isFreePro(email))) return true;
  return subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
}

/** Agent can use public lead capture (form, profile) */
export function hasLeadCaptureAccess(
  subscriptionStatus: string | null | undefined,
  subscriptionPlan: string | null | undefined,
  email?: string | null
): boolean {
  if (!hasAppAccess(subscriptionStatus, email)) return false;
  // Admin and free Pro accounts get full lead capture access
  if (email && (isAdminEmail(email) || isFreePro(email))) return true;
  const plan = subscriptionPlan;
  return isStarterPriceId(plan) || isProPriceId(plan);
}

/** Pro-only lead tools: open houses, public agent profile, SMS alerts */
export function hasProLeadToolsAccess(
  subscriptionStatus: string | null | undefined,
  subscriptionPlan: string | null | undefined,
  email?: string | null
): boolean {
  if (!hasAppAccess(subscriptionStatus, email)) return false;
  // Comp Pro accounts only — admin follows their real subscription for plan-gated features
  if (email && isFreePro(email)) return true;
  return isProPriceId(subscriptionPlan);
}

export function getPaidPlanName(
  subscriptionPlan: string | null | undefined
): PaidPlanName | null {
  if (isProPriceId(subscriptionPlan)) {
    return 'pro';
  }
  if (isStarterPriceId(subscriptionPlan)) {
    return 'starter';
  }
  return null;
}

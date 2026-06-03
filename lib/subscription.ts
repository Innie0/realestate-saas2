/**
 * Subscription helpers — hard paywall: only trialing/active paid plans get app access.
 */

export const ADMIN_EMAIL = 'callon786@outlook.com';

export const STARTER_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_1Sw9B7Enz9g2d62xiHw3wYn5';
export const PRO_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_1Sw9MdEnz9g2d62xlyjilIoq';

export type PaidPlanName = 'starter' | 'pro';

export function isAdminEmail(email: string | undefined | null): boolean {
  return email === ADMIN_EMAIL;
}

/** User can use the dashboard and APIs */
export function hasAppAccess(
  subscriptionStatus: string | null | undefined,
  email?: string | null
): boolean {
  if (email && isAdminEmail(email)) return true;
  return subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
}

/** Agent can use public lead capture (form, profile) */
export function hasLeadCaptureAccess(
  subscriptionStatus: string | null | undefined,
  subscriptionPlan: string | null | undefined,
  email?: string | null
): boolean {
  if (!hasAppAccess(subscriptionStatus, email)) return false;
  const plan = subscriptionPlan;
  return (
    plan === STARTER_PRICE_ID ||
    plan === PRO_PRICE_ID ||
    plan === 'starter' ||
    plan === 'pro'
  );
}

export function getPaidPlanName(
  subscriptionPlan: string | null | undefined
): PaidPlanName | null {
  if (
    subscriptionPlan === PRO_PRICE_ID ||
    subscriptionPlan === 'pro'
  ) {
    return 'pro';
  }
  if (
    subscriptionPlan === STARTER_PRICE_ID ||
    subscriptionPlan === 'starter'
  ) {
    return 'starter';
  }
  return null;
}

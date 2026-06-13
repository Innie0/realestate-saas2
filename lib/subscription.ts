/**
 * Subscription helpers — hard paywall: only trialing/active paid plans get app access.
 */

export const ADMIN_EMAIL = 'callon786@outlook.com';

// Free Pro accounts — full Pro access, no subscription required
const FREE_PRO_EMAILS = ['aliq@theagencyre.com', 'realesticai@gmail.com'];

export const STARTER_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_1Sw9B7Enz9g2d62xiHw3wYn5';
export const PRO_PRICE_ID =
  process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_1Sw9MdEnz9g2d62xlyjilIoq';

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

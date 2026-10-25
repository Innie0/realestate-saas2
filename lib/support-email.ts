/** Default inbox for contact form and support (override with SUPPORT_EMAIL env). */
export const SUPPORT_EMAIL = 'support@oikaro.com';

export function getSupportEmail(): string {
  return process.env.SUPPORT_EMAIL ?? SUPPORT_EMAIL;
}

/**
 * Resend "from" for transactional mail — must match a domain verified in Resend.
 * Override with RESEND_FROM in production when the verified sender differs.
 */
export function getSupportFrom(): string {
  return process.env.RESEND_FROM ?? 'Oikaro <noreply@oikaro.com>';
}

/** @deprecated Use getSupportFrom() so RESEND_FROM env is respected at runtime. */
export const SUPPORT_FROM = 'Oikaro <noreply@oikaro.com>';

/** Legal and privacy requests go to the same monitored inbox. */
export const LEGAL_EMAIL = SUPPORT_EMAIL;
export const PRIVACY_EMAIL = SUPPORT_EMAIL;

/** Default inbox for contact form and support (override with SUPPORT_EMAIL env). */
export const SUPPORT_EMAIL = 'support@oikaro.ai';

export function getSupportEmail(): string {
  return process.env.SUPPORT_EMAIL ?? SUPPORT_EMAIL;
}

/**
 * Resend "from" for transactional mail — must match a domain verified in Resend.
 * Override with RESEND_FROM in production when the verified domain differs from oikaro.ai.
 */
export function getSupportFrom(): string {
  return process.env.RESEND_FROM ?? 'Oikaro <noreply@realestic.ai>';
}

/** @deprecated Use getSupportFrom() so RESEND_FROM env is respected at runtime. */
export const SUPPORT_FROM = 'Oikaro <noreply@realestic.ai>';

export const LEGAL_EMAIL = 'legal@oikaro.com';
export const PRIVACY_EMAIL = 'privacy@oikaro.com';

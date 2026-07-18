/** Default inbox for contact form and support (override with SUPPORT_EMAIL env). */
export const SUPPORT_EMAIL = 'support@oikaro.ai';

export function getSupportEmail(): string {
  return process.env.SUPPORT_EMAIL ?? SUPPORT_EMAIL;
}

/** Resend "from" for transactional mail — verify domain in Resend. */
export const SUPPORT_FROM = 'Oikaro <noreply@oikaro.ai>';

export const LEGAL_EMAIL = 'legal@oikaro.com';
export const PRIVACY_EMAIL = 'privacy@oikaro.com';

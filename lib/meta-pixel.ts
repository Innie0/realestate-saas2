/**
 * Meta (Facebook) Pixel helpers. Events carry no personal data — only event
 * names and, for Subscribe, the plan value.
 */

/** Digits only, since it's placed inside the pixel's script. */
export const META_PIXEL_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '').replace(/\D/g, '');

/** Set by the Google sign-in callback for brand-new accounts; read once on the next page. */
export const NEW_SIGNUP_COOKIE = 'oikaro_new_signup';

type FbqParams = Record<string, string | number>;

declare global {
  interface Window {
    fbq?: (command: 'init' | 'track' | 'trackCustom', name: string, params?: FbqParams) => void;
  }
}

export type MetaStandardEvent = 'PageView' | 'Lead' | 'CompleteRegistration' | 'Subscribe';

export function trackMetaEvent(event: MetaStandardEvent, params?: FbqParams): void {
  if (!META_PIXEL_ID || typeof window === 'undefined' || !window.fbq) return;
  window.fbq('track', event, params);
}

/**
 * Fire an event and give the browser a moment to send it before the page
 * navigates away (e.g. right before a redirect to Stripe checkout).
 */
export async function trackMetaEventBeforeLeaving(event: MetaStandardEvent, params?: FbqParams): Promise<void> {
  if (!META_PIXEL_ID || typeof window === 'undefined' || !window.fbq) return;
  trackMetaEvent(event, params);
  await new Promise((resolve) => setTimeout(resolve, 300));
}

/** Inbox for contact form submissions and general support. */
export const SUPPORT_EMAIL = 'realesticai@gmail.com';

export function getSupportEmail(): string {
  return process.env.SUPPORT_EMAIL ?? SUPPORT_EMAIL;
}

export const SUPPORT_FROM = 'Realestic <noreply@realestic.ai>';

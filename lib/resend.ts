import { Resend } from 'resend';

export type OutboundEmail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  reply_to?: string;
};

export function getResendErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return 'Unknown error';
}

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function sendEmail(emailData: OutboundEmail) {
  const resend = getResendClient();
  if (!resend) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  const { data, error } = await resend.emails.send(emailData);
  if (error) {
    console.error('[Resend] Error sending email:', error);
    throw new Error(getResendErrorMessage(error));
  }
  return data;
}

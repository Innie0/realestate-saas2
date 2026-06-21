import { Resend } from 'resend';

export type OutboundEmail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  reply_to?: string;
};

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function sendEmail(emailData: OutboundEmail) {
  const resend = getResendClient();
  if (!resend) {
    console.warn('[Resend] RESEND_API_KEY not set — skipping email send');
    return null;
  }
  const { data, error } = await resend.emails.send(emailData);
  if (error) {
    console.error('[Resend] Error sending email:', error);
    throw error;
  }
  return data;
}

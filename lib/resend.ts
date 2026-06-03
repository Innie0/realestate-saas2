import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Realestic <noreply@realestic.ai>';

interface LeadEmailData {
  leadName: string;
  leadEmail: string;
  agentName: string;
  leadType?: string | null;
  area?: string;
  timeline?: string;
}

function getLeadTypeLabel(leadType?: string | null): string {
  const labels: Record<string, string> = {
    buyer: 'buying',
    seller: 'selling',
    renter: 'renting',
    browsing: 'exploring',
  };
  return leadType ? labels[leadType] || leadType : 'your real estate search';
}

function baseHtml(body: string, agentName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="padding:32px 28px;">
      ${body}
    </div>
    <div style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Sent on behalf of ${agentName} via Realestic</p>
    </div>
  </div>
</body>
</html>`;
}

export function buildWelcomeEmail(data: LeadEmailData) {
  const firstName = data.leadName.split(' ')[0];
  const agentFirst = data.agentName.split(' ')[0];

  return {
    from: FROM_EMAIL,
    to: data.leadEmail,
    subject: `Thanks for reaching out, ${firstName}!`,
    html: baseHtml(`
      <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">Hi ${firstName},</h2>
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
        Thanks for reaching out! ${agentFirst} received your info and will be in touch shortly.
      </p>
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
        In the meantime, feel free to reply to this email if you have any questions about ${getLeadTypeLabel(data.leadType)}.
      </p>
      <p style="margin:24px 0 0;font-size:15px;color:#374151;">Best,<br/>${data.agentName}</p>
    `, data.agentName),
  };
}

export function buildFollowUp1Email(data: LeadEmailData) {
  const firstName = data.leadName.split(' ')[0];
  const areaText = data.area ? ` in ${data.area}` : '';

  return {
    from: FROM_EMAIL,
    to: data.leadEmail,
    subject: `Still thinking about ${getLeadTypeLabel(data.leadType)}${areaText}?`,
    html: baseHtml(`
      <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">Hi ${firstName},</h2>
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
        Just checking in — I hope you're doing well! I wanted to follow up on your interest in ${getLeadTypeLabel(data.leadType)}${areaText}.
      </p>
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
        The market moves fast, and I'd love to help you stay ahead. Whether you have questions or are ready to take the next step, I'm here for you.
      </p>
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
        Just reply to this email — I typically respond within a few hours.
      </p>
      <p style="margin:24px 0 0;font-size:15px;color:#374151;">Talk soon,<br/>${data.agentName}</p>
    `, data.agentName),
  };
}

export function buildFollowUp2Email(data: LeadEmailData) {
  const firstName = data.leadName.split(' ')[0];

  return {
    from: FROM_EMAIL,
    to: data.leadEmail,
    subject: `Any questions I can answer, ${firstName}?`,
    html: baseHtml(`
      <h2 style="margin:0 0 16px;font-size:20px;color:#111827;">Hi ${firstName},</h2>
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
        I know life gets busy, so I just wanted to send a quick note. If ${getLeadTypeLabel(data.leadType)} is still on your mind, I'm happy to answer any questions — no pressure at all.
      </p>
      <p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">
        Even if you're just exploring, I can send you some useful market info for your area. Just say the word!
      </p>
      <p style="margin:24px 0 0;font-size:15px;color:#374151;">All the best,<br/>${data.agentName}</p>
    `, data.agentName),
  };
}

export async function sendEmail(emailData: { from: string; to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) {
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

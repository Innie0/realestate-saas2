import twilio from 'twilio';

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

const LEAD_TYPE_LABELS: Record<string, string> = {
  buyer: 'Buyer',
  seller: 'Seller',
  renter: 'Renter',
  browsing: 'Browsing',
};

export async function sendLeadAlertSMS(
  agentPhone: string,
  leadName: string,
  leadType?: string | null,
  leadPhone?: string | null,
  leadEmail?: string | null,
  source: string = 'lead form',
) {
  const client = getClient();
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!client || !from) {
    console.warn('[Twilio] Missing credentials — skipping SMS');
    return null;
  }

  const typeLabel = leadType ? ` (${LEAD_TYPE_LABELS[leadType] || leadType})` : '';
  const contact = leadPhone || leadEmail || '';
  const contactLine = contact ? `\nContact: ${contact}` : '';

  const body = `New lead from Realestic!\n${leadName}${typeLabel} just submitted your ${source}.${contactLine}\n\nRespond quickly — speed wins deals!`;

  const message = await client.messages.create({
    body,
    from,
    to: agentPhone,
  });

  return message.sid;
}

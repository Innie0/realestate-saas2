import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/resend';
import { SUPPORT_FROM, getSupportEmail } from '@/lib/support-email';

const TOPICS = ['general', 'sales', 'support', 'billing'] as const;
type ContactTopic = (typeof TOPICS)[number];

const TOPIC_LABELS: Record<ContactTopic, string> = {
  general: 'General inquiry',
  sales: 'Sales',
  support: 'Product support',
  billing: 'Billing',
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, topic, message, company } = body;

    if (company) {
      return NextResponse.json({ success: true, message: 'Thanks for reaching out.' });
    }

    const cleanName = typeof name === 'string' ? name.trim().slice(0, 120) : '';
    const cleanEmail = typeof email === 'string' ? email.trim().slice(0, 254) : '';
    const cleanTopic: ContactTopic =
      typeof topic === 'string' && TOPICS.includes(topic as ContactTopic)
        ? (topic as ContactTopic)
        : 'general';
    const cleanMessage = typeof message === 'string' ? message.trim().slice(0, 5000) : '';

    if (!cleanName) {
      return NextResponse.json({ success: false, error: 'Please enter your name.' }, { status: 400 });
    }
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email.' }, { status: 400 });
    }
    if (cleanMessage.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Please enter a message (at least 10 characters).' },
        { status: 400,
        },
      );
    }

    const topicLabel = TOPIC_LABELS[cleanTopic];
    const subject = `[Realestic Contact] ${topicLabel} — ${cleanName}`;

    await sendEmail({
      from: SUPPORT_FROM,
      to: getSupportEmail(),
      reply_to: cleanEmail,
      subject,
      html: `
        <div style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
          <p style="margin: 0 0 16px;"><strong>New contact form submission</strong></p>
          <p style="margin: 0 0 8px;"><strong>Topic:</strong> ${escapeHtml(topicLabel)}</p>
          <p style="margin: 0 0 8px;"><strong>Name:</strong> ${escapeHtml(cleanName)}</p>
          <p style="margin: 0 0 16px;"><strong>Email:</strong> ${escapeHtml(cleanEmail)}</p>
          <p style="margin: 0 0 8px;"><strong>Message:</strong></p>
          <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(cleanMessage)}</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Thanks — we received your message and will reply soon.',
    });
  } catch (error) {
    console.error('POST /api/contact error:', error);
    return NextResponse.json(
      { success: false, error: 'Could not send your message. Please email us directly.' },
      { status: 500 },
    );
  }
}

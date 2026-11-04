import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/resend';
import { getSupportFrom } from '@/lib/support-email';

/** Every feedback message is also emailed here so it's seen right away. */
const FEEDBACK_INBOX = 'ali@oikaro.com';

const TYPE_LABELS: Record<string, string> = { general: 'General', bug: 'Bug report', feature: 'Feature request' };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 5000) : '';
    const type = TYPE_LABELS[body.type] ? body.type : 'general';
    const page = typeof body.page === 'string' ? body.page.slice(0, 300) : null;

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Saved with the server key: the table has no user-level access rules
    const { error } = await createAdminClient().from('feedback').insert({
      user_id: user?.id ?? null,
      email: user?.email ?? null,
      type,
      message,
      page,
    });

    if (error) {
      console.error('Feedback insert error:', error);
      return NextResponse.json({ success: false, error: 'Could not save feedback' }, { status: 500 });
    }

    // Email is a bonus: if it fails, the message is still saved
    try {
      const name = String(user?.user_metadata?.full_name || '').trim();
      const from = [name, user?.email].filter(Boolean).join(' · ') || 'Signed-out visitor';
      await sendEmail({
        from: getSupportFrom(),
        to: FEEDBACK_INBOX,
        subject: `Oikaro feedback (${TYPE_LABELS[type]}) from ${name || user?.email || 'a visitor'}`,
        html: `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#111;">
  <p style="margin:0 0 6px;"><strong>${escapeHtml(TYPE_LABELS[type])}</strong> from ${escapeHtml(from)}</p>
  ${page ? `<p style="margin:0 0 14px;color:#555;font-size:13px;">Page: ${escapeHtml(page)}</p>` : ''}
  <p style="margin:0;white-space:pre-wrap;">${escapeHtml(message)}</p>
</div>`,
        ...(user?.email ? { reply_to: user.email } : {}),
      });
    } catch (emailError) {
      console.error('Feedback email error:', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

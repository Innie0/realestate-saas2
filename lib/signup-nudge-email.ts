/**
 * "You're one step away" email: sent once, a few hours after someone creates an
 * account but hasn't started a trial. Comes from Ali personally; replies go to his inbox.
 */

import { createAdminClient } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/resend';
import { isFreePro } from '@/lib/subscription';

const FROM = 'Ali from Oikaro <ali@oikaro.com>';
const REPLY_TO = 'ali@oikaro.com';

/** Stored on the auth user's app_metadata once sent, so nobody gets it twice. */
const SENT_FLAG = 'signup_nudge_sent';

/** Wait this long after sign-up before sending. */
const DELAY_MS = 3 * 60 * 60 * 1000;
/** Only people who signed up recently; older accounts are left alone. */
const MAX_AGE_MS = 4 * 24 * 60 * 60 * 1000;

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.oikaro.com').replace(/\/$/, '');

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function buildSignupNudgeEmail(firstName: string): { subject: string; html: string } {
  const name = escapeHtml(firstName);
  const pricingUrl = `${SITE_URL}/pricing#plans`;
  return {
    subject: firstName === 'there' ? "You're one step away" : `You're one step away, ${firstName}`,
    html: `<!doctype html>
<html><body style="margin:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111;">
  <div style="max-width:520px;margin:0 auto;padding:28px 20px;font-size:15px;line-height:1.6;">
    <p style="margin:0 0 16px;">Hi ${name},</p>
    <p style="margin:0 0 16px;">
      Thanks for creating your Oikaro account! It looks like you didn't get to pick a plan yet,
      so I wanted to make sure nothing got in the way.
    </p>
    <p style="margin:0 0 8px;">A few things people usually ask:</p>
    <ul style="margin:0 0 20px;padding-left:20px;">
      <li style="margin-bottom:6px;"><strong>You won't be charged for 7 days.</strong> Cancel anytime before then and you pay nothing.</li>
      <li style="margin-bottom:6px;"><strong>We email you 3 days before your trial ends,</strong> so there are no surprise charges.</li>
      <li><strong>Everything is included in the trial:</strong> owner info, CMAs, listing descriptions, your lead inbox and calendar.</li>
    </ul>
    <p style="margin:0 0 22px;">
      <a href="${pricingUrl}" style="display:inline-block;background:#0668E1;color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:8px;">
        Start your free trial
      </a>
    </p>
    <p style="margin:0 0 20px;">
      If something stopped you, like pricing or a missing feature, just hit reply and tell me. I read every email.
    </p>
    <p style="margin:0;">Ali<br /><span style="color:#555;">Founder, Oikaro</span></p>
  </div>
</body></html>`,
  };
}

const HAS_PLAN = new Set(['active', 'trialing', 'past_due']);

/** Find recent sign-ups without a plan and send each one the email once. */
export async function processSignupNudges(): Promise<{ sent: number; failed: number }> {
  const supabase = createAdminClient();
  const now = Date.now();

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, subscription_status, created_at')
    .gte('created_at', new Date(now - MAX_AGE_MS).toISOString())
    .lte('created_at', new Date(now - DELAY_MS).toISOString());
  if (error) throw error;

  let sent = 0;
  let failed = 0;

  for (const user of users || []) {
    // Has (or had) a plan, gets free access, or is one of ours
    if (!user.email || HAS_PLAN.has(user.subscription_status) || user.subscription_status === 'canceled') continue;
    if (isFreePro(user.email) || user.email.toLowerCase().endsWith('@oikaro.com')) continue;

    const { data: auth } = await supabase.auth.admin.getUserById(user.id);
    const authUser = auth?.user;
    if (!authUser || authUser.app_metadata?.[SENT_FLAG]) continue;

    const fullName = String(authUser.user_metadata?.full_name || authUser.user_metadata?.name || '').trim();
    const firstName = fullName.split(/\s+/)[0] || 'there';
    const { subject, html } = buildSignupNudgeEmail(firstName);

    try {
      // Mark first, so a failure after sending can never cause a second email
      await supabase.auth.admin.updateUserById(user.id, {
        app_metadata: { ...authUser.app_metadata, [SENT_FLAG]: new Date().toISOString() },
      });
      await sendEmail({ from: FROM, to: user.email, subject, html, reply_to: REPLY_TO });
      sent++;
    } catch (err) {
      console.error('[SignupNudge] Failed for', user.id, err);
      failed++;
    }
  }

  return { sent, failed };
}

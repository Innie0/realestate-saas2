/**
 * "Your trial ends soon" email, sent when Stripe signals a trial is about to
 * end (customer.subscription.trial_will_end, ~3 days before). Tells the agent
 * the date and exact amount so the first charge is never a surprise.
 */

import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendEmail } from '@/lib/resend';
import { getSupportEmail, getSupportFrom } from '@/lib/support-email';
import { isProPriceId } from '@/lib/pricing';

/** Set on the Stripe subscription once sent, so a retried webhook doesn't email twice. */
const SENT_FLAG = 'trial_reminder_sent';

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://oikaro.com').replace(/\/$/, '');

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export interface TrialReminderDetails {
  firstName: string;
  planName: string;
  interval: 'month' | 'year';
  amountCents: number;
  currency: string;
  trialEnd: Date;
}

export function buildTrialReminderEmail(d: TrialReminderDetails): { subject: string; html: string } {
  const date = d.trialEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
  const amount = formatMoney(d.amountCents, d.currency);
  const charge =
    d.interval === 'year'
      ? `<strong>${amount}</strong> for a year of Oikaro ${d.planName}`
      : `<strong>${amount}</strong> per month for Oikaro ${d.planName}`;
  const manageUrl = `${SITE_URL}/dashboard/account`;
  const name = escapeHtml(d.firstName);

  return {
    subject: `Your Oikaro trial ends on ${date}`,
    html: `<!doctype html>
<html><body style="margin:0;background:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <div style="background:#fff;border:1px solid #e6e8eb;border-radius:12px;padding:28px;">
      <p style="margin:0 0 18px;font-size:15px;">Hi ${name},</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.55;">
        Your free trial of Oikaro ${escapeHtml(d.planName)} ends on <strong>${date}</strong>.
        After that, you'll be charged ${charge}, unless you cancel before then.
      </p>
      <p style="margin:0 0 22px;font-size:15px;line-height:1.55;">
        Want to keep going? You don't need to do anything.<br />
        Want to change plans or cancel? You can do it in a couple of taps:
      </p>
      <a href="${manageUrl}" style="display:inline-block;background:#0668E1;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px;">
        Manage your subscription
      </a>
      <p style="margin:22px 0 0;font-size:13px;line-height:1.55;color:#555;">
        In Oikaro, go to Account, then Manage billing. Questions? Just reply to this email.
      </p>
    </div>
    <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#888;">Oikaro · GreatRock LLC</p>
  </div>
</body></html>`,
  };
}

/** Handle Stripe's trial_will_end signal: email the agent once, with the date and amount. */
export async function sendTrialEndingReminder(subscription: Stripe.Subscription): Promise<void> {
  // Already cancelled, or already reminded (Stripe retries webhooks)
  if (subscription.status !== 'trialing' || subscription.cancel_at_period_end) return;
  if (subscription.metadata?.[SENT_FLAG]) return;
  if (!subscription.trial_end) return;

  const price = subscription.items.data[0]?.price;
  if (!price?.unit_amount) return;

  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from('users')
    .select('id, email')
    .eq('stripe_customer_id', subscription.customer as string)
    .maybeSingle();
  if (!user?.email) return;

  const { data: auth } = await supabase.auth.admin.getUserById(user.id);
  const fullName = String(auth?.user?.user_metadata?.full_name || auth?.user?.user_metadata?.name || '').trim();
  const firstName = fullName.split(/\s+/)[0] || 'there';

  const { subject, html } = buildTrialReminderEmail({
    firstName,
    planName: isProPriceId(price.id) ? 'Pro' : 'Starter',
    interval: price.recurring?.interval === 'year' ? 'year' : 'month',
    amountCents: price.unit_amount,
    currency: price.currency || 'usd',
    trialEnd: new Date(subscription.trial_end * 1000),
  });

  await sendEmail({ from: getSupportFrom(), to: user.email, subject, html, reply_to: getSupportEmail() });

  await stripe.subscriptions.update(subscription.id, {
    metadata: { ...subscription.metadata, [SENT_FLAG]: new Date().toISOString() },
  });
}

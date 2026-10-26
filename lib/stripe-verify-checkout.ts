import type { SupabaseClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe-server';
import { subscriptionFieldsFromStripe } from '@/lib/stripe-billing-sync';

export type VerifyCheckoutResult =
  | { ok: true; subscription?: { value: number; currency: string; trial: boolean } }
  | { ok: false; error: string; status: number };

export async function verifyCheckoutSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<VerifyCheckoutResult> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription', 'line_items'],
  });

  if (session.metadata?.user_id && session.metadata.user_id !== userId) {
    return { ok: false, error: 'This checkout session does not belong to your account.', status: 403 };
  }

  if (session.status !== 'complete' && session.status !== 'open') {
    return { ok: false, error: 'Checkout is not complete yet. Please wait a moment and refresh.', status: 400 };
  }

  const updateData: Record<string, unknown> = {
    stripe_customer_id: session.customer,
  };

  if (session.mode === 'subscription' && session.subscription) {
    const sub = session.subscription as import('stripe').Stripe.Subscription;
    Object.assign(updateData, subscriptionFieldsFromStripe(sub));
  } else {
    updateData.subscription_status = 'active';
  }

  const { error: updateError } = await supabase.from('users').update(updateData).eq('id', userId);

  if (updateError) {
    console.error('[verify-checkout] DB update failed:', updateError.message);
    return { ok: false, error: 'Could not save subscription. The webhook may still activate your account.', status: 500 };
  }

  // Plan price, for ad conversion tracking — only once checkout has actually completed
  const price = session.line_items?.data[0]?.price;
  const subscription =
    session.status === 'complete' && session.mode === 'subscription' && price?.unit_amount != null
      ? {
          value: price.unit_amount / 100,
          currency: (price.currency || 'usd').toUpperCase(),
          trial: (session.subscription as import('stripe').Stripe.Subscription | null)?.status === 'trialing',
        }
      : undefined;

  return { ok: true, subscription };
}

// @ts-nocheck
// Permanently delete the authenticated user's account and cancel Stripe billing.

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { stripe } from '@/lib/stripe-server';
import { isAdminEmail } from '@/lib/subscription';

async function cancelStripeForUser(stripeSubscriptionId: string | null, stripeCustomerId: string | null) {
  if (stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(stripeSubscriptionId);
    } catch (err) {
      console.warn('[Delete account] Could not cancel subscription:', err);
    }
  }

  if (stripeCustomerId) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'all',
        limit: 20,
      });
      for (const sub of subs.data) {
        if (['active', 'trialing', 'past_due', 'unpaid'].includes(sub.status)) {
          try {
            await stripe.subscriptions.cancel(sub.id);
          } catch {
            // continue
          }
        }
      }
    } catch (err) {
      console.warn('[Delete account] Could not list customer subscriptions:', err);
    }
  }
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isAdminEmail(user.email)) {
      return NextResponse.json(
        { error: 'Admin accounts cannot be deleted from the app. Contact support if needed.' },
        { status: 403 },
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('id', user.id)
      .single();

    await cancelStripeForUser(
      userData?.stripe_subscription_id ?? null,
      userData?.stripe_customer_id ?? null,
    );

    const admin = createAdminClient();

    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteAuthError) {
      console.error('[Delete account] Auth delete failed:', deleteAuthError.message);
      return NextResponse.json({ error: 'Could not delete account. Please contact support.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Delete failed';
    console.error('[Delete account]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// @ts-nocheck
// Sync subscription state from Stripe (e.g. after cancel-at-period-end in portal)

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe-server';
import { subscriptionFieldsFromStripe } from '@/lib/stripe-billing-sync';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'Could not load account.' }, { status: 500 });
    }

    let subscriptionId = userData.stripe_subscription_id;

    if (!subscriptionId && userData.stripe_customer_id) {
      const subs = await stripe.subscriptions.list({
        customer: userData.stripe_customer_id,
        status: 'all',
        limit: 10,
      });
      const activeSub = subs.data.find((sub) =>
        ['active', 'trialing', 'past_due', 'unpaid'].includes(sub.status),
      );
      subscriptionId = activeSub?.id ?? null;
    }

    if (!subscriptionId) {
      return NextResponse.json({ synced: false });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const fields = subscriptionFieldsFromStripe(subscription);

    const { error: updateError } = await supabase.from('users').update(fields).eq('id', user.id);
    if (updateError) {
      console.warn('[sync-billing] DB update failed (run supabase-subscription-cancel-flag.sql):', updateError.message);
    }

    return NextResponse.json({ synced: true, billing: fields });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    console.error('[sync-billing]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

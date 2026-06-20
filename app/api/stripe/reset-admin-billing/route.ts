// @ts-nocheck
// Admin-only: cancel Stripe subscriptions and restore comp Starter access (no billing).

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe-server';
import { isAdminEmail } from '@/lib/subscription';

const ACTIVE_SUB_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid']);

async function cancelAllCustomerSubscriptions(customerId: string) {
  const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 50 });

  for (const sub of subs.data) {
    if (!ACTIVE_SUB_STATUSES.has(sub.status) && sub.status !== 'paused') continue;
    try {
      if (sub.cancel_at_period_end) {
        await stripe.subscriptions.cancel(sub.id);
      } else {
        await stripe.subscriptions.cancel(sub.id);
      }
    } catch (err) {
      console.warn('[Reset admin billing] Could not cancel sub', sub.id, err);
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

    if (!isAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Not available for this account.' }, { status: 403 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    if (userData?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(userData.stripe_subscription_id);
      } catch (err) {
        console.warn('[Reset admin billing] Primary sub cancel:', err);
      }
    }

    if (userData?.stripe_customer_id) {
      await cancelAllCustomerSubscriptions(userData.stripe_customer_id);
    }

    await supabase
      .from('users')
      .update({
        subscription_status: null,
        subscription_plan: null,
        stripe_subscription_id: null,
        subscription_current_period_end: null,
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      message: 'Admin access restored. Starter limits apply with no Stripe billing.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Reset failed';
    console.error('[Reset admin billing]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

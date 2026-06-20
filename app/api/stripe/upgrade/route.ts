// @ts-nocheck
// Upgrade an existing Starter subscription to Pro (prorated, no new trial)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe-server';
import {
  getUpgradeProPriceId,
  isProPriceId,
  isStarterPriceId,
  isValidCheckoutPriceId,
} from '@/lib/pricing';
import { prepareAdminForUpgrade } from '@/lib/stripe-admin-upgrade-prep';

const UPGRADEABLE_STATUSES = new Set(['active', 'trialing']);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'You must be logged in to upgrade.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const requestedPriceId = body.priceId as string | undefined;

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .select(
        'stripe_subscription_id, subscription_plan, subscription_status, stripe_customer_id',
      )
      .eq('id', user.id)
      .single();

    let userData = userRow;
    if (userError || !userData) {
      return NextResponse.json({ error: 'Could not load your account.' }, { status: 500 });
    }

    const prep = await prepareAdminForUpgrade(supabase, user.id, user.email, userData);
    if (prep.checkoutUrl) {
      return NextResponse.json({
        success: false,
        needsCheckout: true,
        url: prep.checkoutUrl,
        message: 'Connect a Starter subscription first, then upgrade to Pro.',
      });
    }
    userData = prep.userData;

    if (isProPriceId(userData.subscription_plan)) {
      return NextResponse.json({ error: 'You are already on Pro.' }, { status: 400 });
    }

    if (!isStarterPriceId(userData.subscription_plan)) {
      return NextResponse.json(
        { error: 'Upgrade is only available from an active Starter plan.' },
        { status: 400 },
      );
    }

    if (!UPGRADEABLE_STATUSES.has(userData.subscription_status ?? '')) {
      return NextResponse.json(
        { error: 'Your subscription must be active before you can upgrade.' },
        { status: 400 },
      );
    }

    if (!userData.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No subscription found. Please subscribe on the pricing page first.' },
        { status: 400 },
      );
    }

    const proPriceId = requestedPriceId ?? getUpgradeProPriceId(userData.subscription_plan);

    if (!isValidCheckoutPriceId(proPriceId) || !isProPriceId(proPriceId)) {
      return NextResponse.json({ error: 'Invalid Pro plan selected.' }, { status: 400 });
    }

    const subscription = await stripe.subscriptions.retrieve(userData.stripe_subscription_id);
    const subscriptionItemId = subscription.items.data[0]?.id;

    if (!subscriptionItemId) {
      return NextResponse.json({ error: 'Could not read your subscription details.' }, { status: 500 });
    }

    const updateParams: Parameters<typeof stripe.subscriptions.update>[1] = {
      items: [{ id: subscriptionItemId, price: proPriceId }],
      proration_behavior: 'always_invoice',
      metadata: {
        ...subscription.metadata,
        upgraded_from: userData.subscription_plan ?? 'starter',
        upgraded_at: new Date().toISOString(),
      },
    };

    if (subscription.status === 'trialing') {
      updateParams.trial_end = 'now';
    }

    const updated = await stripe.subscriptions.update(
      userData.stripe_subscription_id,
      updateParams,
    );

    const newPriceId = updated.items.data[0]?.price.id ?? proPriceId;

    await supabase
      .from('users')
      .update({
        stripe_subscription_id: updated.id,
        subscription_plan: newPriceId,
        subscription_status: updated.status,
        subscription_current_period_end: new Date(
          updated.current_period_end * 1000,
        ).toISOString(),
      })
      .eq('id', user.id);

    return NextResponse.json({
      success: true,
      subscriptionId: updated.id,
      status: updated.status,
      plan: newPriceId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to upgrade subscription';
    console.error('[Stripe Upgrade]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

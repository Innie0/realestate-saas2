// @ts-nocheck
// Admin-only: create Stripe Checkout for Starter (live-mode upgrade testing)

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdminEmail } from '@/lib/subscription';
import { isProPriceId, isStarterPriceId } from '@/lib/pricing';
import {
  adminCanUpgrade,
  createAdminStarterCheckoutSession,
  prepareAdminForUpgrade,
} from '@/lib/stripe-admin-upgrade-prep';

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
      .select(
        'stripe_subscription_id, subscription_plan, subscription_status, stripe_customer_id',
      )
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'Could not load account.' }, { status: 500 });
    }

    if (isProPriceId(userData.subscription_plan) && userData.stripe_subscription_id) {
      return NextResponse.json({ error: 'You already have Pro in Stripe.' }, { status: 400 });
    }

    if (adminCanUpgrade(userData)) {
      return NextResponse.json({
        success: true,
        ready: true,
        message: 'Starter subscription is ready. You can upgrade to Pro.',
      });
    }

    const prep = await prepareAdminForUpgrade(supabase, user.id, user.email, userData);

    if (prep.checkoutUrl) {
      return NextResponse.json({ success: true, url: prep.checkoutUrl });
    }

    if (adminCanUpgrade(prep.userData)) {
      return NextResponse.json({
        success: true,
        ready: true,
        message: 'Starter subscription is ready. You can upgrade to Pro.',
      });
    }

    return NextResponse.json({ error: 'Could not prepare Starter subscription.' }, { status: 500 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Setup failed';
    console.error('[Stripe Setup Starter]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

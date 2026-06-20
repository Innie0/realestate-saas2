#!/usr/bin/env node
/**
 * One-off: reset admin billing in Supabase + cancel Stripe subscriptions.
 * Usage: node --env-file=.env.local scripts/reset-admin-billing.mjs
 */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'callon786@outlook.com';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl || !serviceRoleKey || !stripeKey) {
  console.error('Missing env vars. Run with: node --env-file=.env.local scripts/reset-admin-billing.mjs');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);
const stripe = new Stripe(stripeKey);

const ACTIVE = new Set(['active', 'trialing', 'past_due', 'unpaid']);

async function main() {
  const { data: authList, error: authError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (authError) {
    console.error('Auth lookup failed:', authError.message);
    process.exit(1);
  }

  const authUser = authList.users.find(
    (u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase(),
  );

  if (!authUser) {
    console.error('Auth user not found:', ADMIN_EMAIL);
    process.exit(1);
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_plan')
    .eq('id', authUser.id)
    .single();
  console.log('Before:', {
    subscription_status: user.subscription_status,
    subscription_plan: user.subscription_plan,
    stripe_subscription_id: user.stripe_subscription_id,
    stripe_customer_id: user.stripe_customer_id,
  });

  const toCancel = new Set();
  if (user.stripe_subscription_id) toCancel.add(user.stripe_subscription_id);

  if (user.stripe_customer_id) {
    const subs = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'all',
      limit: 50,
    });
    for (const sub of subs.data) {
      if (ACTIVE.has(sub.status) || sub.status === 'paused' || sub.cancel_at_period_end) {
        toCancel.add(sub.id);
      }
    }
  }

  for (const subId of toCancel) {
    try {
      await stripe.subscriptions.cancel(subId);
      console.log('Canceled Stripe subscription:', subId);
    } catch (err) {
      console.warn('Could not cancel', subId, err.message);
    }
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({
      subscription_status: null,
      subscription_plan: null,
      stripe_subscription_id: null,
      subscription_current_period_end: null,
      subscription_cancel_at_period_end: false,
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('DB update failed:', updateError.message);
    process.exit(1);
  }

  console.log('Done. Admin restored to comp Starter access (no Stripe billing in app).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

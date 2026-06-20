// @ts-nocheck
// Ensures the admin account has a real Stripe Starter subscription before upgrading.

import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe-server';
import { STARTER_MONTHLY_PRICE_ID, isProPriceId, isStarterPriceId } from '@/lib/pricing';
import { isAdminEmail } from '@/lib/subscription';

const UPGRADEABLE_STATUSES = new Set(['active', 'trialing']);

export type UserBillingRow = {
  stripe_subscription_id: string | null;
  subscription_plan: string | null;
  subscription_status: string | null;
  stripe_customer_id: string | null;
};

export type PrepareAdminResult = {
  userData: UserBillingRow;
  /** When set, client should redirect to Stripe Checkout before upgrading. */
  checkoutUrl?: string;
};

function subscriptionStarterPriceId(sub: Stripe.Subscription): string | null {
  return sub.items.data[0]?.price?.id ?? null;
}

function isUpgradeableStarterSub(sub: Stripe.Subscription): boolean {
  if (!UPGRADEABLE_STATUSES.has(sub.status)) return false;
  const priceId = subscriptionStarterPriceId(sub);
  return !!priceId && isStarterPriceId(priceId);
}

async function syncUserBilling(
  supabase: SupabaseClient,
  userId: string,
  sub: Stripe.Subscription,
): Promise<UserBillingRow> {
  const plan = subscriptionStarterPriceId(sub) ?? sub.items.data[0]?.price?.id ?? null;
  const row: UserBillingRow = {
    stripe_subscription_id: sub.id,
    subscription_plan: plan,
    subscription_status: sub.status,
    stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null,
  };

  await supabase
    .from('users')
    .update({
      stripe_subscription_id: row.stripe_subscription_id,
      subscription_plan: row.subscription_plan,
      subscription_status: row.subscription_status,
      subscription_current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      ...(row.stripe_customer_id ? { stripe_customer_id: row.stripe_customer_id } : {}),
    })
    .eq('id', userId);

  return row;
}

async function getOrCreateCustomer(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  existingCustomerId: string | null,
): Promise<string> {
  if (existingCustomerId) return existingCustomerId;

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId, admin_test: 'true' },
  });

  await supabase.from('users').update({ stripe_customer_id: customer.id }).eq('id', userId);
  return customer.id;
}

async function findStarterSubscription(customerId: string): Promise<Stripe.Subscription | null> {
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 20,
  });

  return subs.data.find(isUpgradeableStarterSub) ?? null;
}

async function attachTestPaymentMethod(customerId: string): Promise<void> {
  const paymentMethod = await stripe.paymentMethods.create({
    type: 'card',
    card: {
      number: '4242424242424242',
      exp_month: 12,
      exp_year: 2034,
      cvc: '123',
    },
  });

  await stripe.paymentMethods.attach(paymentMethod.id, { customer: customerId });
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethod.id },
  });
}

async function createTestStarterSubscription(customerId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: STARTER_MONTHLY_PRICE_ID }],
    trial_period_days: 7,
    metadata: { admin_test: 'true' },
  });
}

export async function createAdminStarterCheckoutSession(
  customerId: string,
  userId: string,
): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: STARTER_MONTHLY_PRICE_ID, quantity: 1 }],
    mode: 'subscription',
    success_url: `${appUrl}/dashboard/upgrade?starter=ready`,
    cancel_url: `${appUrl}/dashboard/upgrade?canceled=1`,
    metadata: { user_id: userId, admin_setup: 'true' },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    subscription_data: {
      trial_period_days: 7,
      trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
    },
    payment_method_collection: 'always',
  });

  if (!session.url) {
    throw new Error('Could not create Stripe checkout session.');
  }

  return session.url;
}

/**
 * Admin-only: sync or create a Stripe Starter subscription so upgrade can be tested end-to-end.
 */
export async function prepareAdminForUpgrade(
  supabase: SupabaseClient,
  userId: string,
  email: string | undefined | null,
  userData: UserBillingRow,
): Promise<PrepareAdminResult> {
  if (!isAdminEmail(email)) {
    return { userData };
  }

  if (
    isProPriceId(userData.subscription_plan) &&
    userData.stripe_subscription_id &&
    UPGRADEABLE_STATUSES.has(userData.subscription_status ?? '')
  ) {
    return { userData };
  }

  const customerId = await getOrCreateCustomer(
    supabase,
    userId,
    email!,
    userData.stripe_customer_id,
  );

  const existingSub =
    (userData.stripe_subscription_id
      ? await stripe.subscriptions.retrieve(userData.stripe_subscription_id).catch(() => null)
      : null) ?? (await findStarterSubscription(customerId));

  if (existingSub && isUpgradeableStarterSub(existingSub)) {
    const synced = await syncUserBilling(supabase, userId, existingSub);
    return { userData: synced };
  }

  if (existingSub && isProPriceId(subscriptionStarterPriceId(existingSub))) {
    const synced = await syncUserBilling(supabase, userId, existingSub);
    return { userData: synced };
  }

  const isTestMode = (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_test_');
  if (!isTestMode) {
    const checkoutUrl = await createAdminStarterCheckoutSession(customerId, userId);
    return { userData, checkoutUrl };
  }

  await attachTestPaymentMethod(customerId);
  const newSub = await createTestStarterSubscription(customerId);
  const synced = await syncUserBilling(supabase, userId, newSub);
  return { userData: synced };
}

/** True when admin has an upgradeable Starter subscription in Stripe. */
export function adminCanUpgrade(userData: UserBillingRow): boolean {
  return (
    isStarterPriceId(userData.subscription_plan) &&
    !!userData.stripe_subscription_id &&
    UPGRADEABLE_STATUSES.has(userData.subscription_status ?? '')
  );
}

import type Stripe from 'stripe';

export type StripeBillingFields = {
  stripe_subscription_id: string;
  subscription_status: string;
  subscription_plan: string | null;
  subscription_current_period_end: string;
  subscription_cancel_at_period_end: boolean;
};

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): number | null {
  const fromItem = subscription.items.data[0]?.current_period_end;
  if (fromItem) return fromItem;

  const legacy = (subscription as Stripe.Subscription & { current_period_end?: number })
    .current_period_end;
  if (legacy) return legacy;

  if (subscription.status === 'trialing' && subscription.trial_end) {
    return subscription.trial_end;
  }

  return null;
}

export function subscriptionFieldsFromStripe(
  subscription: Stripe.Subscription,
): StripeBillingFields {
  const periodEnd = getSubscriptionPeriodEnd(subscription);

  return {
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    subscription_plan: subscription.items.data[0]?.price.id ?? null,
    subscription_current_period_end: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : new Date().toISOString(),
    subscription_cancel_at_period_end: subscription.cancel_at_period_end,
  };
}

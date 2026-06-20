import type Stripe from 'stripe';

export type StripeBillingFields = {
  stripe_subscription_id: string;
  subscription_status: string;
  subscription_plan: string | null;
  subscription_current_period_end: string;
  subscription_cancel_at_period_end: boolean;
};

export function subscriptionFieldsFromStripe(
  subscription: Stripe.Subscription,
): StripeBillingFields {
  return {
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    subscription_plan: subscription.items.data[0]?.price.id ?? null,
    subscription_current_period_end: new Date(
      subscription.current_period_end * 1000,
    ).toISOString(),
    subscription_cancel_at_period_end: subscription.cancel_at_period_end,
  };
}

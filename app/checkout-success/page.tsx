// @ts-nocheck
// Checkout success page
// Verifies the Stripe session server-side and updates the DB immediately,
// eliminating the race condition between the redirect and the webhook.

import { redirect } from 'next/navigation';
import { stripe } from '@/lib/stripe-server';
import { createClient } from '@/lib/supabase-server';
import { subscriptionFieldsFromStripe } from '@/lib/stripe-billing-sync';

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  if (!session_id) {
    redirect('/pricing');
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect('/auth/login');
    }

    // Retrieve the completed checkout session directly from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription'],
    });

    // Make sure this session belongs to this user
    if (session.metadata?.user_id && session.metadata.user_id !== user.id) {
      redirect('/pricing');
    }

    if (session.status === 'complete' || session.status === 'open') {
      const updateData: Record<string, unknown> = {
        stripe_customer_id: session.customer,
      };

      if (session.mode === 'subscription' && session.subscription) {
        const sub = session.subscription as import('stripe').Stripe.Subscription;
        Object.assign(updateData, subscriptionFieldsFromStripe(sub));
      } else {
        updateData.subscription_status = 'active';
      }

      await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);
    }
  } catch (err) {
    console.error('[checkout-success] Error verifying session:', err);
    // Still redirect to dashboard — the webhook will catch up
  }

  redirect('/dashboard?welcome=true');
}

// @ts-nocheck
// Stripe Webhook Handler — uses service role so RLS does not block subscription updates.

import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { subscriptionFieldsFromStripe } from '@/lib/stripe-billing-sync';

async function findUserByCustomerId(supabase: ReturnType<typeof createAdminClient>, customerId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();
  return user;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    console.error('Webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;

        if (!userId) {
          console.error('No user_id in session metadata');
          break;
        }

        const updateData: Record<string, unknown> = {
          stripe_customer_id: session.customer,
        };

        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          Object.assign(updateData, subscriptionFieldsFromStripe(subscription));
        } else {
          updateData.subscription_status = 'active';
        }

        const { error } = await supabase.from('users').update(updateData).eq('id', userId);
        if (error) console.error('[Webhook] checkout.session.completed update failed:', error.message);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await findUserByCustomerId(supabase, subscription.customer as string);
        if (!user) break;

        const { error } = await supabase
          .from('users')
          .update(subscriptionFieldsFromStripe(subscription))
          .eq('id', user.id);
        if (error) console.error('[Webhook] subscription.updated update failed:', error.message);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await findUserByCustomerId(supabase, subscription.customer as string);
        if (!user) break;

        const { error } = await supabase
          .from('users')
          .update({
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            subscription_plan: null,
            subscription_current_period_end: null,
            subscription_cancel_at_period_end: false,
          })
          .eq('id', user.id);
        if (error) console.error('[Webhook] subscription.deleted update failed:', error.message);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription || !invoice.customer) break;

        const user = await findUserByCustomerId(supabase, invoice.customer as string);
        if (!user) break;

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        const { error } = await supabase
          .from('users')
          .update(subscriptionFieldsFromStripe(subscription))
          .eq('id', user.id);
        if (error) console.error('[Webhook] invoice.payment_succeeded update failed:', error.message);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.customer) break;

        const user = await findUserByCustomerId(supabase, invoice.customer as string);
        if (!user) break;

        const { error } = await supabase
          .from('users')
          .update({ subscription_status: 'past_due' })
          .eq('id', user.id);
        if (error) console.error('[Webhook] invoice.payment_failed update failed:', error.message);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook handler error';
    console.error('Error handling webhook event:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

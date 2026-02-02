// @ts-nocheck
// Stripe Webhook Handler
// Listens for Stripe events and updates database accordingly

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-server';
import { createClient } from '@/lib/supabase-server';
import Stripe from 'stripe';

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        console.log('Checkout session completed:', session.id);
        
        // Get user ID from metadata
        const userId = session.metadata?.user_id;
        
        if (!userId) {
          console.error('No user_id in session metadata');
          break;
        }

        // Update user's subscription info
        const updateData: any = {
          stripe_customer_id: session.customer,
          subscription_status: 'active',
        };

        // If it's a subscription, get the subscription details
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          
          updateData.stripe_subscription_id = subscription.id;
          updateData.subscription_plan = subscription.items.data[0]?.price.id;
          updateData.subscription_current_period_end = new Date(
            subscription.current_period_end * 1000
          ).toISOString();
        }

        await supabase
          .from('users')
          .update(updateData)
          .eq('id', userId);

        console.log('User subscription updated:', userId);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log('Subscription updated:', subscription.id);

        // Find user by Stripe customer ID
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single();

        if (!user) {
          console.error('User not found for customer:', subscription.customer);
          break;
        }

        // Update subscription details
        await supabase
          .from('users')
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            subscription_plan: subscription.items.data[0]?.price.id,
            subscription_current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
          })
          .eq('id', user.id);

        console.log('Subscription status updated:', user.id, subscription.status);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        console.log('Subscription deleted:', subscription.id);

        // Find user by Stripe customer ID
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', subscription.customer)
          .single();

        if (!user) {
          console.error('User not found for customer:', subscription.customer);
          break;
        }

        // Cancel subscription
        await supabase
          .from('users')
          .update({
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            subscription_plan: null,
          })
          .eq('id', user.id);

        console.log('Subscription canceled:', user.id);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        console.log('Invoice payment succeeded:', invoice.id);
        
        // Update payment status if needed
        // You can track payment history here
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        console.log('Invoice payment failed:', invoice.id);
        
        // Handle failed payment (e.g., send email, update status)
        // Find user by customer ID and update status
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', invoice.customer)
          .single();

        if (user) {
          await supabase
            .from('users')
            .update({ subscription_status: 'past_due' })
            .eq('id', user.id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook event:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

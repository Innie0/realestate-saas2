// @ts-nocheck
// Stripe Checkout API Route
// Creates a checkout session for subscription or one-time payment

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe-server';

/**
 * POST /api/stripe/checkout
 * Create a Stripe checkout session
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('[Stripe Checkout] Auth check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    });
    
    if (authError || !user) {
      console.error('[Stripe Checkout] Unauthorized:', authError?.message);
      return NextResponse.json(
        { error: 'You must be logged in to subscribe. Please sign in and try again.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { priceId, mode = 'subscription' } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customerId: string | undefined;
    
    // Check if user already has a Stripe customer ID
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (userData?.stripe_customer_id) {
      customerId = userData.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      
      customerId = customer.id;
      
      // Save customer ID to database
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create checkout session configuration
    const sessionConfig: any = {
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode, // 'subscription' or 'payment'
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    };

    // Add 7-day trial for subscriptions
    if (mode === 'subscription') {
      sessionConfig.subscription_data = {
        trial_period_days: 7,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel',
          },
        },
      };
      // Collect payment method upfront but don't charge until trial ends
      sessionConfig.payment_method_collection = 'always';
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ 
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

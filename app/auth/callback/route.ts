// @ts-nocheck
// Auth callback route - Handles OAuth redirects

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { hasAppAccess, isAdminEmail, isFreePro } from '@/lib/subscription';
import { stripe } from '@/lib/stripe-server';

const PLAN_PRICE_IDS: Record<string, string> = {
  starter: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_1ThC6REnz9g2d62xbnpRKW0h',
  pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_1Sw9MdEnz9g2d62xlyjilIoq',
};

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const plan = requestUrl.searchParams.get('plan')?.toLowerCase() || '';

  if (code) {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !user) {
      console.error('[OAuth Callback] Error exchanging code:', error?.message);
      return NextResponse.redirect(new URL('/auth/login?error=auth_failed', requestUrl.origin));
    }

    if (isAdminEmail(user.email) || isFreePro(user.email)) {
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    }

    const { data: userData } = await supabase
      .from('users')
      .select('subscription_status, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (hasAppAccess(userData?.subscription_status, user.email)) {
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    }

    // If user selected a plan, create a Stripe checkout session and redirect there
    const priceId = PLAN_PRICE_IDS[plan];
    if (priceId) {
      try {
        let customerId = userData?.stripe_customer_id;

        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            metadata: { supabase_user_id: user.id },
          });
          customerId = customer.id;
          await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', user.id);
        }

        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          line_items: [{ price: priceId, quantity: 1 }],
          mode: 'subscription',
          success_url: `${requestUrl.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${requestUrl.origin}/pricing?canceled=true`,
          metadata: { user_id: user.id },
          allow_promotion_codes: true,
          billing_address_collection: 'auto',
          subscription_data: {
            trial_period_days: 7,
            trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
          },
          payment_method_collection: 'always',
        });

        if (session.url) {
          return NextResponse.redirect(session.url);
        }
      } catch (err) {
        console.error('[OAuth Callback] Stripe checkout error:', err);
        // Fall through to pricing page
      }
    }

    return NextResponse.redirect(new URL('/pricing', requestUrl.origin));
  }

  return NextResponse.redirect(new URL('/auth/login?error=auth_failed', requestUrl.origin));
}

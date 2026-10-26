// @ts-nocheck
// Auth callback route - Handles OAuth redirects

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { hasAppAccess, isAdminEmail, isFreePro } from '@/lib/subscription';
import { stripe } from '@/lib/stripe-server';
import { PRO_MONTHLY_PRICE_ID, STARTER_MONTHLY_PRICE_ID } from '@/lib/pricing';
import { NEW_SIGNUP_COOKIE } from '@/lib/meta-pixel';

/** An account created in the last few minutes is a new Google sign-up, not a returning sign-in. */
const NEW_ACCOUNT_WINDOW_MS = 5 * 60 * 1000;

function withSignupFlag(response: NextResponse, isNewAccount: boolean): NextResponse {
  if (isNewAccount) {
    // Read once by the Meta Pixel on the next Oikaro page, then cleared
    response.cookies.set(NEW_SIGNUP_COOKIE, '1', { path: '/', maxAge: 60 * 60, sameSite: 'lax' });
  }
  return response;
}

const PLAN_PRICE_IDS: Record<string, string> = {
  starter: STARTER_MONTHLY_PRICE_ID,
  pro: PRO_MONTHLY_PRICE_ID,
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

    const isNewAccount = Date.now() - Date.parse(user.created_at ?? '') < NEW_ACCOUNT_WINDOW_MS;

    if (isAdminEmail(user.email) || isFreePro(user.email)) {
      return withSignupFlag(NextResponse.redirect(new URL('/dashboard', requestUrl.origin)), isNewAccount);
    }

    const { data: userData } = await supabase
      .from('users')
      .select('subscription_status, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (hasAppAccess(userData?.subscription_status, user.email)) {
      return withSignupFlag(NextResponse.redirect(new URL('/dashboard', requestUrl.origin)), isNewAccount);
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
          return withSignupFlag(NextResponse.redirect(session.url), isNewAccount);
        }
      } catch (err) {
        console.error('[OAuth Callback] Stripe checkout error:', err);
        // Fall through to pricing page
      }
    }

    return withSignupFlag(NextResponse.redirect(new URL('/pricing', requestUrl.origin)), isNewAccount);
  }

  return NextResponse.redirect(new URL('/auth/login?error=auth_failed', requestUrl.origin));
}

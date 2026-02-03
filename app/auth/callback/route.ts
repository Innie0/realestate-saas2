// @ts-nocheck
// Auth callback route - Handles OAuth redirects
// This route is called by Supabase after OAuth authentication

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET handler for OAuth callbacks
 * Redirects new users to pricing page, existing users to dashboard
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    
    // Exchange the code for a session
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error || !user) {
      console.error('[OAuth Callback] Error exchanging code:', error?.message);
      return NextResponse.redirect(new URL('/auth/login?error=auth_failed', requestUrl.origin));
    }

    // Check subscription status to determine where to redirect
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', user.id)
      .single();
    
    const hasActiveSubscription = 
      userData?.subscription_status === 'active' || 
      userData?.subscription_status === 'trialing';

    console.log('[OAuth Callback] User authenticated:', {
      userId: user.id,
      email: user.email,
      subscriptionStatus: userData?.subscription_status,
      hasActiveSubscription,
    });

    // Redirect based on subscription status
    if (hasActiveSubscription) {
      // Has active subscription - redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    } else {
      // No subscription - redirect to pricing page
      return NextResponse.redirect(new URL('/pricing', requestUrl.origin));
    }
  }

  // If no code, redirect to login with error
  return NextResponse.redirect(new URL('/auth/login?error=auth_failed', requestUrl.origin));
}


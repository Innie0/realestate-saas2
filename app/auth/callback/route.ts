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

    // Check if user is admin
    const isAdmin = user.email === 'callon786@outlook.com';
    
    console.log('[OAuth Callback] User authenticated:', {
      userId: user.id,
      email: user.email,
      isAdmin,
    });
    
    if (isAdmin) {
      // Admin user - redirect directly to dashboard
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    }
    
    // All authenticated users go to dashboard (free plan is available for everyone)
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
  }

  // If no code, redirect to login with error
  return NextResponse.redirect(new URL('/auth/login?error=auth_failed', requestUrl.origin));
}


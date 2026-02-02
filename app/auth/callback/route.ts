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

    // Check if this is a new user by checking when they were created
    // If created in last 10 seconds, treat as new signup
    const userCreatedAt = new Date(user.created_at);
    const now = new Date();
    const secondsSinceCreation = (now.getTime() - userCreatedAt.getTime()) / 1000;
    const isNewUser = secondsSinceCreation < 10;

    console.log('[OAuth Callback] User authenticated:', {
      userId: user.id,
      email: user.email,
      createdAt: userCreatedAt,
      secondsSinceCreation,
      isNewUser,
    });

    // Redirect based on whether this is a new signup or existing login
    if (isNewUser) {
      // New signup - redirect to pricing page
      return NextResponse.redirect(new URL('/pricing', requestUrl.origin));
    } else {
      // Existing user login - redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    }
  }

  // If no code, redirect to login with error
  return NextResponse.redirect(new URL('/auth/login?error=auth_failed', requestUrl.origin));
}


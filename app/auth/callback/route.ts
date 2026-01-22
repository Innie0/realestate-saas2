// Auth callback route - Handles OAuth redirects
// This route is called by Supabase after OAuth authentication

import { NextResponse } from 'next/server';

/**
 * GET handler for OAuth callbacks
 * Redirects user to dashboard after successful authentication
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    // Exchange the code for a session
    // This is handled automatically by Supabase
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
  }

  // If no code, redirect to login with error
  return NextResponse.redirect(new URL('/auth/login?error=auth_failed', requestUrl.origin));
}


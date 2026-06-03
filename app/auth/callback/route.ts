// @ts-nocheck
// Auth callback route - Handles OAuth redirects

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { hasAppAccess, isAdminEmail } from '@/lib/subscription';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !user) {
      console.error('[OAuth Callback] Error exchanging code:', error?.message);
      return NextResponse.redirect(new URL('/auth/login?error=auth_failed', requestUrl.origin));
    }

    if (isAdminEmail(user.email)) {
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    }

    const { data: userData } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    if (hasAppAccess(userData?.subscription_status, user.email)) {
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    }

    return NextResponse.redirect(new URL('/pricing', requestUrl.origin));
  }

  return NextResponse.redirect(new URL('/auth/login?error=auth_failed', requestUrl.origin));
}

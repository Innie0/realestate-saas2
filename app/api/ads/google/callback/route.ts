// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { exchangeGoogleAdsCode, getGoogleAccountEmail } from '@/lib/ads/google-ads-oauth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/dashboard/ads?error=google_auth_failed', request.url));
    }
    if (!code) {
      return NextResponse.redirect(new URL('/dashboard/ads?error=missing_code', request.url));
    }

    const tokens = await exchangeGoogleAdsCode(code);
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(new URL('/dashboard/ads?error=not_authenticated', request.url));
    }

    const email = await getGoogleAccountEmail(tokens.access_token);

    const { error: upsertError } = await supabase.from('ad_platform_connections').upsert(
      {
        user_id: user.id,
        provider: 'google',
        email,
        account_name: email ? `Google Ads · ${email}` : 'Google Ads',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : new Date(Date.now() + 3600 * 1000).toISOString(),
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' }
    );

    if (upsertError) {
      console.error('Google Ads save error:', upsertError);
      return NextResponse.redirect(new URL('/dashboard/ads?error=save_failed', request.url));
    }

    return NextResponse.redirect(new URL('/dashboard/ads?connected=google', request.url));
  } catch (err) {
    console.error('Google Ads callback error:', err);
    return NextResponse.redirect(new URL('/dashboard/ads?error=token_exchange_failed', request.url));
  }
}

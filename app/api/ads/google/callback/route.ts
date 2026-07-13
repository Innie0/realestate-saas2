// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { exchangeGoogleAdsCode, getGoogleAccountEmail } from '@/lib/ads/google-ads-oauth';
import { listGoogleAdsCustomers } from '@/lib/ads/google-list-customers';

function redirectWith(base: URL, params: Record<string, string>) {
  const url = new URL('/dashboard/ads', base);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return redirectWith(request.url, { error: 'google_auth_failed' });
    }
    if (!code) {
      return redirectWith(request.url, { error: 'missing_code' });
    }

    const tokens = await exchangeGoogleAdsCode(code);
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return redirectWith(request.url, { error: 'not_authenticated' });
    }

    const email = await getGoogleAccountEmail(tokens.access_token);
    const googleAds = await listGoogleAdsCustomers(tokens.access_token);

    const { error: upsertError } = await supabase.from('ad_platform_connections').upsert(
      {
        user_id: user.id,
        provider: 'google',
        email,
        account_id: googleAds.customerId,
        account_name: googleAds.customerName ?? (email ? `Google Ads · ${email}` : 'Google Ads'),
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
      return redirectWith(request.url, { error: 'save_failed' });
    }

    if (googleAds.customerId) {
      return redirectWith(request.url, { connected: 'google', status: 'ready' });
    }
    if (!googleAds.verified) {
      return redirectWith(request.url, { connected: 'google', status: 'unverified' });
    }
    return redirectWith(request.url, { connected: 'google', status: 'setup_required' });
  } catch (err) {
    console.error('Google Ads callback error:', err);
    return redirectWith(request.url, { error: 'token_exchange_failed' });
  }
}

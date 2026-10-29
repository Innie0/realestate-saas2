// @ts-nocheck
// Meta (Facebook Login) OAuth callback for connecting an agent's Meta ad account.
// Registered in the Meta app as the Valid OAuth Redirect URI: <app url>/api/meta/callback
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  META_ADS_OAUTH_STATE_COOKIE,
  exchangeMetaAdsCode,
  getMetaAccountInfo,
} from '@/lib/ads/meta-ads-oauth';

function redirectWith(base: string, params: Record<string, string>) {
  const url = new URL('/dashboard/ads', base);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const response = NextResponse.redirect(url);
  // One-time value — clear it whatever the outcome
  response.cookies.set(META_ADS_OAUTH_STATE_COOKIE, '', { path: '/api', maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // The agent clicked "Cancel" on Facebook's permission screen
    if (searchParams.get('error')) {
      return redirectWith(request.url, { error: 'meta_auth_failed' });
    }

    const code = searchParams.get('code');
    if (!code) {
      return redirectWith(request.url, { error: 'missing_code' });
    }

    const expectedState = request.cookies.get(META_ADS_OAUTH_STATE_COOKIE)?.value;
    if (!expectedState || searchParams.get('state') !== expectedState) {
      return redirectWith(request.url, { error: 'state_mismatch' });
    }

    // Check the Oikaro login before using the one-time code
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return redirectWith(request.url, { error: 'not_authenticated' });
    }

    const tokens = await exchangeMetaAdsCode(code);
    const account = await getMetaAccountInfo(tokens.access_token);

    const { error: upsertError } = await supabase.from('ad_platform_connections').upsert(
      {
        user_id: user.id,
        provider: 'meta',
        email: account.email,
        account_id: account.accountId,
        account_name: account.accountName ?? 'Meta Ads',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_expiry: new Date(tokens.expiry_date).toISOString(),
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' }
    );

    if (upsertError) {
      console.error('Meta Ads save error:', upsertError.message);
      return redirectWith(request.url, { error: 'save_failed' });
    }

    return redirectWith(request.url, {
      connected: 'meta',
      status: account.hasAdAccount ? 'ready' : 'setup_required',
    });
  } catch (err) {
    console.error('Meta Ads callback error:', err instanceof Error ? err.message : err);
    return redirectWith(request.url, { error: 'token_exchange_failed' });
  }
}

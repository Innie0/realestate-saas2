// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { exchangeMetaAdsCode, getMetaAccountInfo } from '@/lib/ads/meta-ads-oauth';

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
      return redirectWith(request.url, { error: 'meta_auth_failed' });
    }
    if (!code) {
      return redirectWith(request.url, { error: 'missing_code' });
    }

    const tokens = await exchangeMetaAdsCode(code);
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return redirectWith(request.url, { error: 'not_authenticated' });
    }

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
      console.error('Meta Ads save error:', upsertError);
      return redirectWith(request.url, { error: 'save_failed' });
    }

    if (account.hasAdAccount) {
      return redirectWith(request.url, { connected: 'meta', status: 'ready' });
    }
    return redirectWith(request.url, { connected: 'meta', status: 'setup_required' });
  } catch (err) {
    console.error('Meta Ads callback error:', err);
    return redirectWith(request.url, { error: 'token_exchange_failed' });
  }
}

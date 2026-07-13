// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { APIResponse } from '@/types';
import { listGoogleAdsCustomers } from '@/lib/ads/google-list-customers';
import { getMetaAccountInfo } from '@/lib/ads/meta-ads-oauth';
import type { AdPlatform } from '@/lib/ads/types';

/**
 * POST /api/ads/connections/refresh
 * Re-check stored OAuth tokens for an ad account id (after user creates an account externally).
 * Body: { provider: 'google' | 'meta' }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' } satisfies APIResponse, {
        status: 401,
      });
    }

    const body = await request.json();
    const provider = body?.provider as AdPlatform | undefined;
    if (provider !== 'google' && provider !== 'meta') {
      return NextResponse.json(
        { success: false, error: 'Invalid provider' } satisfies APIResponse,
        { status: 400 },
      );
    }

    const { data: connection, error: fetchError } = await supabase
      .from('ad_platform_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .eq('is_active', true)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!connection?.access_token) {
      return NextResponse.json(
        { success: false, error: 'No active connection to refresh' } satisfies APIResponse,
        { status: 404 },
      );
    }

    let accountId: string | null = connection.account_id;
    let accountName: string | null = connection.account_name;
    let status: 'ready' | 'setup_required' | 'unverified' = accountId ? 'ready' : 'setup_required';

    if (provider === 'meta') {
      const meta = await getMetaAccountInfo(connection.access_token);
      accountId = meta.accountId;
      accountName = meta.accountName ?? connection.account_name;
      status = meta.hasAdAccount ? 'ready' : 'setup_required';
    } else {
      const google = await listGoogleAdsCustomers(connection.access_token);
      accountId = google.customerId;
      accountName = google.customerName ?? connection.account_name;
      if (google.customerId) {
        status = 'ready';
      } else if (!google.verified) {
        status = 'unverified';
      } else {
        status = 'setup_required';
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('ad_platform_connections')
      .update({
        account_id: accountId,
        account_name: accountName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id)
      .select('id, user_id, provider, account_id, account_name, email, is_active, created_at, updated_at')
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      data: updated,
      status,
      message:
        status === 'ready'
          ? 'Ad account found — you can publish ads now.'
          : status === 'unverified'
            ? 'Google is signed in, but we could not verify an ads account yet.'
            : 'Still no ad account on this login. Create one, then check again.',
    } satisfies APIResponse);
  } catch (error: any) {
    console.error('Refresh ad connection error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to refresh connection' } satisfies APIResponse,
      { status: 500 },
    );
  }
}

// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { APIResponse } from '@/types';
import { listGoogleAdsCustomers } from '@/lib/ads/google-list-customers';
import {
  getFreshGoogleAccessToken,
  GOOGLE_CONNECTION_MESSAGES,
  googleAccountColumns,
  googleConnectionStatus,
  isMissingLoginCustomerColumn,
  type GoogleConnectionStatus,
} from '@/lib/ads/google-connection';
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
    let status: GoogleConnectionStatus = accountId ? 'ready' : 'setup_required';
    let extraColumns: Record<string, string> = {};

    if (provider === 'meta') {
      const meta = await getMetaAccountInfo(connection.access_token);
      accountId = meta.accountId;
      accountName = meta.accountName ?? connection.account_name;
      status = meta.hasAdAccount ? 'ready' : 'setup_required';
    } else {
      const accessToken = await getFreshGoogleAccessToken(supabase, connection);
      const google = await listGoogleAdsCustomers(accessToken);
      const { account_id, account_name, ...rest } = googleAccountColumns(
        google,
        connection.account_name,
      );
      accountId = account_id;
      accountName = account_name;
      extraColumns = rest;
      status = googleConnectionStatus(google);
    }

    const { data: updated, error: updateError } = await supabase
      .from('ad_platform_connections')
      .update({
        account_id: accountId,
        account_name: accountName,
        ...extraColumns,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id)
      .select('id, user_id, provider, account_id, account_name, email, is_active, created_at, updated_at')
      .single();

    if (isMissingLoginCustomerColumn(updateError)) {
      return NextResponse.json({
        success: true,
        data: connection && {
          id: connection.id,
          user_id: connection.user_id,
          provider: connection.provider,
          account_id: connection.account_id,
          account_name: connection.account_name,
          email: connection.email,
          is_active: connection.is_active,
          created_at: connection.created_at,
          updated_at: connection.updated_at,
        },
        status: 'db_update_needed',
        message: GOOGLE_CONNECTION_MESSAGES.db_update_needed,
      } satisfies APIResponse);
    }
    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      data: updated,
      status,
      message:
        provider === 'google'
          ? status === 'ready'
            ? 'Ad account found — you can publish ads now.'
            : GOOGLE_CONNECTION_MESSAGES[status]
          : status === 'ready'
            ? 'Ad account found — you can publish ads now.'
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

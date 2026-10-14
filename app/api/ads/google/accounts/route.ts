// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { listGoogleAdAccounts } from '@/lib/ads/google-list-customers';
import { getFreshGoogleAccessToken, isMissingLoginCustomerColumn } from '@/lib/ads/google-connection';
import { GOOGLE_CONNECTION_MESSAGES } from '@/lib/ads/google-connection-status';
import { normalizeCustomerId } from '@/lib/ads/google-ads-api';
import { APIResponse } from '@/types';

async function loadConnection(supabase, userId: string) {
  const { data } = await supabase
    .from('ad_platform_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .eq('is_active', true)
    .maybeSingle();
  return data?.access_token ? data : null;
}

/**
 * GET /api/ads/google/accounts
 * The Google Ads accounts the connected login can advertise from, and which one is in use.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' } satisfies APIResponse, { status: 401 });
    }

    const connection = await loadConnection(supabase, user.id);
    if (!connection) {
      return NextResponse.json({ success: false, error: 'Connect Google Ads first.' } satisfies APIResponse, { status: 404 });
    }

    const accessToken = await getFreshGoogleAccessToken(supabase, connection);
    const { accounts } = await listGoogleAdAccounts(accessToken);

    return NextResponse.json({
      success: true,
      data: {
        selectedCustomerId: connection.account_id,
        accounts: accounts.map(({ customerId, label, isTestAccount }) => ({ customerId, label, isTestAccount })),
      },
    } satisfies APIResponse);
  } catch (error: any) {
    console.error('List Google Ads accounts error:', error);
    return NextResponse.json(
      { success: false, error: 'Could not load your Google Ads accounts.' } satisfies APIResponse,
      { status: 500 },
    );
  }
}

/**
 * POST /api/ads/google/accounts
 * Choose which Google Ads account new ads are published to. Body: { customerId }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' } satisfies APIResponse, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const requested = normalizeCustomerId(String(body?.customerId ?? ''));

    const connection = await loadConnection(supabase, user.id);
    if (!connection) {
      return NextResponse.json({ success: false, error: 'Connect Google Ads first.' } satisfies APIResponse, { status: 404 });
    }

    // Only accounts this Google login can really access may be chosen
    const accessToken = await getFreshGoogleAccessToken(supabase, connection);
    const { accounts } = await listGoogleAdAccounts(accessToken);
    const chosen = accounts.find((a) => a.customerId === requested);
    if (!chosen) {
      return NextResponse.json(
        { success: false, error: 'That Google Ads account isn’t available on this login.' } satisfies APIResponse,
        { status: 400 },
      );
    }

    const { error: updateError } = await supabase
      .from('ad_platform_connections')
      .update({
        account_id: chosen.customerId,
        account_name: chosen.label,
        login_customer_id: chosen.loginCustomerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id);

    if (isMissingLoginCustomerColumn(updateError)) {
      return NextResponse.json(
        { success: false, error: GOOGLE_CONNECTION_MESSAGES.db_update_needed } satisfies APIResponse,
        { status: 503 },
      );
    }
    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      data: { selectedCustomerId: chosen.customerId },
      message: `New Google ads will use ${chosen.label}.`,
    } satisfies APIResponse);
  } catch (error: any) {
    console.error('Select Google Ads account error:', error);
    return NextResponse.json(
      { success: false, error: 'Could not switch Google Ads accounts.' } satisfies APIResponse,
      { status: 500 },
    );
  }
}

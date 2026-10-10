import type { SupabaseClient } from '@supabase/supabase-js';
import { refreshGoogleAdsAccessToken } from '@/lib/ads/google-ads-oauth';
import type { GoogleAdsCustomerInfo } from '@/lib/ads/google-list-customers';
import type { AdPlatformConnectionRow } from '@/lib/ads/types';
import {
  GOOGLE_CONNECTION_MESSAGES,
  type GoogleConnectionStatus,
} from '@/lib/ads/google-connection-status';

export { GOOGLE_CONNECTION_MESSAGES, type GoogleConnectionStatus };

export function googleConnectionStatus(info: GoogleAdsCustomerInfo): GoogleConnectionStatus {
  if (info.customerId) return 'ready';
  if (!info.verified) return 'unverified';
  if (info.issue === 'test_token_only') return 'test_token';
  return 'setup_required';
}

const EXPIRY_BUFFER_MS = 2 * 60 * 1000;

/** A valid access token for the connection, refreshing (and saving) it when expired. */
export async function getFreshGoogleAccessToken(
  supabase: SupabaseClient,
  connection: Pick<AdPlatformConnectionRow, 'id' | 'access_token' | 'refresh_token' | 'token_expiry'>,
): Promise<string> {
  const expiresAt = connection.token_expiry ? Date.parse(connection.token_expiry) : 0;
  if (expiresAt - EXPIRY_BUFFER_MS > Date.now() || !connection.refresh_token) {
    return connection.access_token;
  }

  const refreshed = await refreshGoogleAdsAccessToken(connection.refresh_token);
  await supabase
    .from('ad_platform_connections')
    .update({
      access_token: refreshed.access_token,
      token_expiry: new Date(refreshed.expiry_date).toISOString(),
    })
    .eq('id', connection.id);
  return refreshed.access_token;
}

/**
 * Account fields to save for a Google connection. `login_customer_id` is only
 * included when a manager account is involved, so directly-owned ad accounts
 * keep working before the column exists.
 */
export function googleAccountColumns(info: GoogleAdsCustomerInfo, fallbackName: string) {
  return {
    account_id: info.customerId,
    account_name: info.customerName ?? fallbackName,
    ...(info.loginCustomerId ? { login_customer_id: info.loginCustomerId } : {}),
  };
}

/** Supabase error for a column that hasn't been added yet. */
export function isMissingLoginCustomerColumn(error: { message?: string } | null): boolean {
  return Boolean(error?.message && /login_customer_id/.test(error.message));
}

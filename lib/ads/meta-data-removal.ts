/**
 * Remove what Oikaro holds from Meta for a Facebook user, when Meta tells us
 * they removed the app (deauthorize) or asked for their data to be deleted.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/** Oikaro accounts whose Meta connection belongs to this Facebook user. */
export async function findOikaroUsersForMetaUser(admin: SupabaseClient, metaUserId: string): Promise<string[]> {
  const { data } = await admin
    .from('ad_platform_connections')
    .select('user_id')
    .eq('provider', 'meta')
    .eq('external_user_id', metaUserId);
  return [...new Set((data ?? []).map((row) => row.user_id as string))];
}

/** Deauthorize: the access token no longer works, so delete the connection. */
export async function removeMetaConnection(admin: SupabaseClient, metaUserId: string): Promise<string[]> {
  const userIds = await findOikaroUsersForMetaUser(admin, metaUserId);
  await admin.from('ad_platform_connections').delete().eq('provider', 'meta').eq('external_user_id', metaUserId);
  return userIds;
}

/**
 * Data deletion: the connection plus every record that came from Meta —
 * Meta ads created through Oikaro (their Meta IDs) and their results.
 * Leads those ads brought in belong to the agent and are kept.
 */
export async function deleteAllMetaData(admin: SupabaseClient, metaUserId: string): Promise<string[]> {
  const userIds = await removeMetaConnection(admin, metaUserId);
  if (userIds.length > 0) {
    // Results rows are removed with their ad (ON DELETE CASCADE)
    await admin.from('ad_promotions').delete().in('user_id', userIds).eq('platform', 'meta');
  }
  return userIds;
}

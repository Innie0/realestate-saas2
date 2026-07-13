import type { AdPlatform, AdPlatformConnection } from '@/lib/ads/types';

/** OAuth completed but no ad account id stored yet. */
export type AdConnectionStatus = 'disconnected' | 'authorized' | 'ready';

export function getConnectionStatus(
  connections: AdPlatformConnection[],
  platform: AdPlatform,
): AdConnectionStatus {
  const conn = connections.find((c) => c.provider === platform && c.is_active);
  if (!conn) return 'disconnected';
  if (conn.account_id) return 'ready';
  return 'authorized';
}

export function isAdAccountReady(
  connections: AdPlatformConnection[],
  platform: AdPlatform,
): boolean {
  return getConnectionStatus(connections, platform) === 'ready';
}

export function getConnection(
  connections: AdPlatformConnection[],
  platform: AdPlatform,
): AdPlatformConnection | undefined {
  return connections.find((c) => c.provider === platform && c.is_active);
}

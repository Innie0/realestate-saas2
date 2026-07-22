'use client';

import { ExternalLink, Loader2, RefreshCw, Unplug } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { AdPlatform, AdPlatformConnection } from '@/lib/ads/types';
import { getConnectionStatus, type AdConnectionStatus } from '@/lib/ads/connection-status';
import { getAdAccountSetupLabel, getAdAccountSetupUrl, getExternalAdsUrl } from '@/lib/ads/urls';
import clsx from 'clsx';

interface AdsConnectionsPanelProps {
  connections: AdPlatformConnection[];
  connecting: AdPlatform | null;
  disconnecting: AdPlatform | null;
  refreshing: AdPlatform | null;
  onConnect: (platform: AdPlatform) => void;
  onDisconnect: (platform: AdPlatform) => void;
  onRefresh: (platform: AdPlatform) => void;
}

const PLATFORMS: Array<{
  id: AdPlatform;
  name: string;
  description: string;
  accent: string;
}> = [
  {
    id: 'google',
    name: 'Google Ads',
    description: 'Search and display campaigns on Google',
    accent: 'G',
  },
  {
    id: 'meta',
    name: 'Meta Ads',
    description: 'Facebook and Instagram ad campaigns',
    accent: 'M',
  },
];

function connectionFor(
  connections: AdPlatformConnection[],
  platform: AdPlatform,
): AdPlatformConnection | undefined {
  return connections.find((c) => c.provider === platform && c.is_active);
}

function StatusBadge({ status }: { status: AdConnectionStatus }) {
  if (status === 'ready') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700 border border-emerald-200">
        Ready to publish
      </span>
    );
  }
  if (status === 'authorized') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-medium text-amber-800 border border-amber-200">
        Setup required
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10.5px] font-medium text-gray-700 border border-gray-200">
      Not connected
    </span>
  );
}

function setupMessage(platform: AdPlatform, status: AdConnectionStatus, conn?: AdPlatformConnection) {
  if (status !== 'authorized') return null;

  if (platform === 'google') {
    const hasLogin = Boolean(conn?.email);
    return hasLogin
      ? `Signed in as ${conn?.email}, but no Google Ads account was found on this login. Create one with the same Google email, add billing, then click “Check again”.`
      : 'Google is authorized, but no Google Ads customer account was detected yet.';
  }

  return conn?.email
    ? `Signed in as ${conn.email}, but no Meta ad account exists yet. Create one in Ads Manager (same Facebook login), add a payment method, then click “Check again”.`
    : 'Meta is authorized, but no ad account was found. Create one in Ads Manager, then check again.';
}

export default function AdsConnectionsPanel({
  connections,
  connecting,
  disconnecting,
  refreshing,
  onConnect,
  onDisconnect,
  onRefresh,
}: AdsConnectionsPanelProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {PLATFORMS.map((platform) => {
        const conn = connectionFor(connections, platform.id);
        const status = getConnectionStatus(connections, platform.id);
        const isConnecting = connecting === platform.id;
        const isDisconnecting = disconnecting === platform.id;
        const isRefreshing = refreshing === platform.id;
        const setupHint = setupMessage(platform.id, status, conn);

        return (
          <Card key={platform.id} className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div
                className={clsx(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-sm font-semibold',
                  platform.id === 'google'
                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                    : 'bg-brand-50 text-gray-900 border border-brand-200',
                )}
              >
                {platform.accent}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[13px] font-semibold text-gray-900">{platform.name}</h3>
                  <StatusBadge status={status} />
                </div>
                <p className="text-caption text-gray-700 mt-1">{platform.description}</p>
                {conn && (
                  <p className="text-[12px] text-gray-600 mt-2 truncate">
                    {status === 'ready' && conn.account_name
                      ? conn.account_name
                      : conn.email || conn.account_name || 'Authorized login'}
                  </p>
                )}
                {setupHint && (
                  <p className="text-[12px] text-amber-900 bg-amber-50/80 border border-amber-100 rounded-lg px-3 py-2 mt-3 leading-relaxed">
                    {setupHint}
                  </p>
                )}
                {platform.id === 'meta' && status === 'ready' && (
                  <p className="text-[11.5px] text-gray-700 mt-2">
                    Publishing runs on your connected Meta ad account.
                  </p>
                )}
                {platform.id === 'google' && status === 'ready' && (
                  <p className="text-[11.5px] text-gray-700 mt-2">
                    Google reporting syncs when a developer token is configured. Publishing is Meta-only for now.
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  {conn ? (
                    <>
                      {status === 'authorized' && (
                        <>
                          <a
                            href={getAdAccountSetupUrl(platform.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" className="gap-1.5">
                              {getAdAccountSetupLabel(platform.id)}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRefresh(platform.id)}
                            disabled={isRefreshing}
                            className="gap-1.5"
                          >
                            {isRefreshing ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            Check again
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDisconnect(platform.id)}
                        disabled={isDisconnecting}
                        className="gap-1.5"
                      >
                        {isDisconnecting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Unplug className="h-3.5 w-3.5" />
                        )}
                        Disconnect
                      </Button>
                      {status === 'ready' && (
                        <a
                          href={getExternalAdsUrl(platform.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-brand-600 hover:text-brand-700"
                        >
                          Open manager
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => onConnect(platform.id)}
                      disabled={isConnecting}
                      className="gap-1.5"
                    >
                      {isConnecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Connect {platform.name}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

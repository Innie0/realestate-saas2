'use client';

import { ExternalLink, Loader2, Unplug } from 'lucide-react';
import Button from '@/components/ui/Button';
import Surface from '@/components/ui/Surface';
import type { AdPlatform, AdPlatformConnection } from '@/lib/ads/types';
import { getExternalAdsUrl } from '@/lib/ads/urls';
import clsx from 'clsx';

interface AdsConnectionsPanelProps {
  connections: AdPlatformConnection[];
  connecting: AdPlatform | null;
  disconnecting: AdPlatform | null;
  onConnect: (platform: AdPlatform) => void;
  onDisconnect: (platform: AdPlatform) => void;
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
  platform: AdPlatform
): AdPlatformConnection | undefined {
  return connections.find((c) => c.provider === platform && c.is_active);
}

export default function AdsConnectionsPanel({
  connections,
  connecting,
  disconnecting,
  onConnect,
  onDisconnect,
}: AdsConnectionsPanelProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {PLATFORMS.map((platform) => {
        const conn = connectionFor(connections, platform.id);
        const isConnecting = connecting === platform.id;
        const isDisconnecting = disconnecting === platform.id;

        return (
          <Surface key={platform.id} flat padding="md">
            <div className="flex items-start gap-3">
              <div
                className={clsx(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-sm font-semibold',
                  platform.id === 'google'
                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                )}
              >
                {platform.accent}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[13px] font-semibold text-gray-900">{platform.name}</h3>
                  {conn ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700 border border-emerald-200">
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10.5px] font-medium text-gray-500 border border-gray-200">
                      Not connected
                    </span>
                  )}
                </div>
                <p className="text-caption text-gray-500 mt-1">{platform.description}</p>
                {conn && (
                  <p className="text-[12px] text-gray-600 mt-2 truncate">
                    {conn.account_name || conn.email || 'Connected account'}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  {conn ? (
                    <>
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
                      <a
                        href={getExternalAdsUrl(platform.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-brand-600 hover:text-brand-700"
                      >
                        Open manager
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
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
          </Surface>
        );
      })}
    </div>
  );
}

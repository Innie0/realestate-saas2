'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardPage from '@/components/layout/DashboardPage';
import Surface from '@/components/ui/Surface';
import AdsConnectionsPanel from '@/components/ads/AdsConnectionsPanel';
import AdsCampaignsTable from '@/components/ads/AdsCampaignsTable';
import { useApi } from '@/lib/swr';
import { formatCompactPrice } from '@/lib/format-price';
import type { AdCampaign, AdPlatform, AdPlatformConnection, AdsSummary } from '@/lib/ads/types';
import clsx from 'clsx';
import { Megaphone } from 'lucide-react';

type PlatformFilter = 'all' | AdPlatform;

const PLATFORM_TABS: { id: PlatformFilter; label: string }[] = [
  { id: 'all', label: 'All platforms' },
  { id: 'google', label: 'Google' },
  { id: 'meta', label: 'Meta' },
];

function AdsPageContent() {
  const searchParams = useSearchParams();
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const [connecting, setConnecting] = useState<AdPlatform | null>(null);
  const [disconnecting, setDisconnecting] = useState<AdPlatform | null>(null);
  const [pageMessage, setPageMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const { data: connections, mutate: mutateConnections } = useApi<AdPlatformConnection[]>(
    '/api/ads/connections'
  );

  const campaignsUrl = `/api/ads/campaigns?platform=${platform}`;
  const {
    data: campaignsPayload,
    isLoading: campaignsLoading,
    mutate: mutateCampaigns,
  } = useApi<{ campaigns: AdCampaign[]; summary: AdsSummary }>(campaignsUrl);

  const campaigns = campaignsPayload?.campaigns ?? [];
  const summary = campaignsPayload?.summary;

  useEffect(() => {
    document.title = 'Ads - Realestic';
  }, []);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'google') {
      setPageMessage({ type: 'success', text: 'Google Ads connected successfully.' });
      void mutateConnections();
      void mutateCampaigns();
    } else if (connected === 'meta') {
      setPageMessage({ type: 'success', text: 'Meta Ads connected successfully.' });
      void mutateConnections();
      void mutateCampaigns();
    } else if (error) {
      const messages: Record<string, string> = {
        google_auth_failed: 'Google authorization was cancelled or failed.',
        meta_auth_failed: 'Meta authorization was cancelled or failed.',
        save_failed: 'Could not save the connection. Run ads-management.sql in Supabase if this persists.',
        not_authenticated: 'Sign in again, then retry connecting your ad account.',
        token_exchange_failed: 'Could not complete authorization. Check OAuth app settings.',
        missing_code: 'Authorization did not return a code. Try connecting again.',
      };
      setPageMessage({
        type: 'error',
        text: messages[error] ?? 'Something went wrong connecting your ad account.',
      });
    }
  }, [searchParams, mutateConnections, mutateCampaigns]);

  const hasConnections = useMemo(
    () => (connections ?? []).some((c) => c.is_active),
    [connections]
  );

  const handleConnect = useCallback(async (provider: AdPlatform) => {
    setConnecting(provider);
    setPageMessage(null);
    try {
      const res = await fetch(`/api/ads/${provider}/connect`, { method: 'POST' });
      const json = await res.json();
      if (json.success && json.data?.authUrl) {
        window.location.href = json.data.authUrl;
        return;
      }
      setPageMessage({
        type: 'error',
        text: json.error || `Could not start ${provider === 'google' ? 'Google' : 'Meta'} Ads connection.`,
      });
    } catch {
      setPageMessage({ type: 'error', text: 'Connection failed. Please try again.' });
    } finally {
      setConnecting(null);
    }
  }, []);

  const handleDisconnect = useCallback(
    async (provider: AdPlatform) => {
      setDisconnecting(provider);
      setPageMessage(null);
      try {
        const res = await fetch(`/api/ads/connections/${provider}`, { method: 'POST' });
        const json = await res.json();
        if (json.success) {
          setPageMessage({
            type: 'success',
            text: `${provider === 'google' ? 'Google' : 'Meta'} Ads disconnected.`,
          });
          void mutateConnections();
          void mutateCampaigns();
        } else {
          setPageMessage({ type: 'error', text: json.error || 'Failed to disconnect.' });
        }
      } catch {
        setPageMessage({ type: 'error', text: 'Failed to disconnect. Please try again.' });
      } finally {
        setDisconnecting(null);
      }
    },
    [mutateConnections, mutateCampaigns]
  );

  const metrics = [
    { label: 'Total spend', value: summary ? formatCompactPrice(summary.spend) : '—' },
    {
      label: 'Impressions',
      value: summary ? summary.impressions.toLocaleString('en-US') : '—',
    },
    { label: 'Clicks', value: summary ? summary.clicks.toLocaleString('en-US') : '—' },
    { label: 'Leads', value: summary ? summary.conversions.toLocaleString('en-US') : '—' },
  ];

  return (
    <DashboardPage
      title="Ads"
      subtitle="Manage Google Ads and Meta Ads campaigns from one place"
    >
      {pageMessage && (
        <div
          className={clsx(
            'rounded-[10px] border px-4 py-3 text-[13px]',
            pageMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          )}
        >
          {pageMessage.text}
        </div>
      )}

      {!hasConnections && (
        <Surface flat padding="md" className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-gray-100 border border-gray-200">
            <Megaphone className="h-4 w-4 text-gray-600" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-900">Connect your ad accounts</p>
            <p className="text-caption text-gray-500 mt-1 max-w-2xl">
              Link Google Ads and Meta Ads to view campaign performance alongside your listings and
              leads. Meta campaigns sync automatically after connect; Google requires a developer
              token for live campaign data.
            </p>
          </div>
        </Surface>
      )}

      <section>
        <p className="text-label mb-3">Connected accounts</p>
        <AdsConnectionsPanel
          connections={connections ?? []}
          connecting={connecting}
          disconnecting={disconnecting}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
      </section>

      {hasConnections && (
        <>
          <Surface flat padding="none" className="overflow-hidden">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y divide-gray-150 lg:divide-y-0 lg:divide-x lg:divide-gray-150">
              {metrics.map((m) => (
                <div key={m.label} className="px-5 py-4">
                  <p className="text-label">{m.label}</p>
                  <p className="mt-2.5 text-[26px] font-semibold tracking-[-0.02em] tabular-nums text-gray-900 leading-none">
                    {campaignsLoading ? '…' : m.value}
                  </p>
                </div>
              ))}
            </div>
          </Surface>

          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <p className="text-label">Campaigns</p>
              <div className="inline-flex rounded-lg bg-gray-100 p-1">
                {PLATFORM_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPlatform(tab.id)}
                    className={clsx(
                      'px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-colors',
                      platform === tab.id
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <AdsCampaignsTable campaigns={campaigns} loading={campaignsLoading} />
          </section>
        </>
      )}
    </DashboardPage>
  );
}

export default function AdsPage() {
  return (
    <Suspense fallback={null}>
      <AdsPageContent />
    </Suspense>
  );
}

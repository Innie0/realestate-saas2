'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardPage from '@/components/layout/DashboardPage';
import Surface from '@/components/ui/Surface';
import AdsConnectionsPanel from '@/components/ads/AdsConnectionsPanel';
import WizardShell from '@/components/ads/wizard/WizardShell';
import PerformanceDashboard from '@/components/ads/PerformanceDashboard';
import AIInsightsFeed from '@/components/ads/AIInsightsFeed';
import AdDetailView from '@/components/ads/AdDetailView';
import OptimizeAdFlow from '@/components/ads/OptimizeAdFlow';
import { useApi } from '@/lib/swr';
import { isAdAccountReady } from '@/lib/ads/connection-status';
import type { AdPlatform, AdPlatformConnection, AdPromotion } from '@/lib/ads/types';
import type { AIInsight, PerformanceDashboardData } from '@/lib/ads/performance-types';
import clsx from 'clsx';
import { BarChart3, ChevronDown, Megaphone, PenLine } from 'lucide-react';

type AdsTab = 'create' | 'performance';

function performanceUrl(days: number, adType: string) {
  const params = new URLSearchParams();
  params.set('days', String(days));
  if (adType) params.set('adType', adType);
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - days);
  params.set('from', from.toISOString().slice(0, 10));
  return `/api/ads/performance?${params.toString()}`;
}

function AdsPageContent() {
  const searchParams = useSearchParams();
  const promoteProjectId = searchParams.get('promote');
  const deepLinkAdId = searchParams.get('ad');
  const initialTab = searchParams.get('tab') === 'performance' || deepLinkAdId ? 'performance' : 'create';

  const [tab, setTab] = useState<AdsTab>(initialTab);
  const [connecting, setConnecting] = useState<AdPlatform | null>(null);
  const [disconnecting, setDisconnecting] = useState<AdPlatform | null>(null);
  const [refreshingConnection, setRefreshingConnection] = useState<AdPlatform | null>(null);
  const [showAccounts, setShowAccounts] = useState(false);
  const [pageMessage, setPageMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [perfDays, setPerfDays] = useState(30);
  const [perfAdType, setPerfAdType] = useState('');
  const [selectedAdId, setSelectedAdId] = useState<string | null>(deepLinkAdId);
  const [refreshingInsights, setRefreshingInsights] = useState(false);
  const [optimizePromotionId, setOptimizePromotionId] = useState<string | null>(null);
  const [optimizeInsight, setOptimizeInsight] = useState<AIInsight | null>(null);

  const { data: connections, mutate: mutateConnections } = useApi<AdPlatformConnection[]>(
    '/api/ads/connections'
  );

  const { mutate: mutatePromotions } = useApi<AdPromotion[]>('/api/ads/promotions');

  const {
    data: performance,
    isLoading: performanceLoading,
    mutate: mutatePerformance,
  } = useApi<PerformanceDashboardData>(tab === 'performance' ? performanceUrl(perfDays, perfAdType) : null);

  const {
    data: insights = [],
    isLoading: insightsLoading,
    mutate: mutateInsights,
  } = useApi<AIInsight[]>(tab === 'performance' ? '/api/ads/insights' : null);

  useEffect(() => {
    document.title = 'Ads - Oikaro';
  }, []);

  useEffect(() => {
    if (deepLinkAdId) {
      setTab('performance');
      setSelectedAdId(deepLinkAdId);
    }
  }, [deepLinkAdId]);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const status = searchParams.get('status');
    const error = searchParams.get('error');

    if (connected === 'google') {
      if (status === 'ready') {
        setPageMessage({ type: 'success', text: 'Google Ads account connected — ready for reporting.' });
      } else if (status === 'unverified') {
        setPageMessage({
          type: 'error',
          text: 'Google signed in, but we could not verify an ads account. Create one at ads.google.com with this email, then click “Check again” under Ad accounts.',
        });
        setShowAccounts(true);
      } else {
        setPageMessage({
          type: 'error',
          text: 'Google signed in, but no Google Ads account exists on this login yet. Create one at ads.google.com, then click “Check again” under Ad accounts.',
        });
        setShowAccounts(true);
      }
      void mutateConnections();
    } else if (connected === 'meta') {
      if (status === 'ready') {
        setPageMessage({ type: 'success', text: 'Meta Ads connected — you can create and publish ads now.' });
      } else {
        setPageMessage({
          type: 'error',
          text: 'Meta signed in, but no ad account was found. Create one in Meta Ads Manager, add billing, then click “Check again” under Ad accounts.',
        });
        setShowAccounts(true);
      }
      void mutateConnections();
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
  }, [searchParams, mutateConnections]);

  const metaConnected = useMemo(
    () => (connections ?? []).some((c) => c.provider === 'meta' && c.is_active),
    [connections]
  );

  const googleConnected = useMemo(
    () => (connections ?? []).some((c) => c.provider === 'google' && c.is_active),
    [connections]
  );

  const metaReady = useMemo(
    () => isAdAccountReady(connections ?? [], 'meta'),
    [connections]
  );

  const googleReady = useMemo(
    () => isAdAccountReady(connections ?? [], 'google'),
    [connections]
  );

  const selectedAd = useMemo(
    () => performance?.ads.find((a) => a.promotionId === selectedAdId) ?? null,
    [performance, selectedAdId]
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
        } else {
          setPageMessage({ type: 'error', text: json.error || 'Failed to disconnect.' });
        }
      } catch {
        setPageMessage({ type: 'error', text: 'Failed to disconnect. Please try again.' });
      } finally {
        setDisconnecting(null);
      }
    },
    [mutateConnections]
  );

  const handleRefreshConnection = useCallback(
    async (provider: AdPlatform) => {
      setRefreshingConnection(provider);
      setPageMessage(null);
      try {
        const res = await fetch('/api/ads/connections/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider }),
        });
        const json = await res.json();
        if (json.success) {
          setPageMessage({
            type: json.status === 'ready' ? 'success' : 'error',
            text: json.message || 'Connection refreshed.',
          });
          void mutateConnections();
        } else {
          setPageMessage({ type: 'error', text: json.error || 'Failed to refresh connection.' });
        }
      } catch {
        setPageMessage({ type: 'error', text: 'Failed to refresh connection. Please try again.' });
      } finally {
        setRefreshingConnection(null);
      }
    },
    [mutateConnections],
  );

  const refreshInsights = async () => {
    setRefreshingInsights(true);
    try {
      await fetch('/api/ai/analyze-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      await mutateInsights();
      await mutatePerformance();
    } finally {
      setRefreshingInsights(false);
    }
  };

  const dismissInsight = async (id: string) => {
    await fetch(`/api/ads/insights/${id}/dismiss`, { method: 'POST' });
    void mutateInsights();
  };

  const openOptimize = (insight: AIInsight) => {
    const promoId = insight.relatedAdIds[0] ?? null;
    if (!promoId) return;
    setOptimizePromotionId(promoId);
    setOptimizeInsight(insight);
  };

  return (
    <DashboardPage
      title="Ads"
      subtitle={
        tab === 'create'
          ? 'Create and publish ads in a few guided steps'
          : 'Track performance and improve with AI'
      }
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

      <div className="flex gap-1 p-1 rounded-lg bg-gray-100 w-fit">
        <button
          type="button"
          onClick={() => setTab('create')}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[13px] font-medium transition-colors',
            tab === 'create' ? 'bg-[var(--surface)] text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <PenLine className="h-3.5 w-3.5" />
          Create ad
        </button>
        <button
          type="button"
          onClick={() => setTab('performance')}
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[13px] font-medium transition-colors',
            tab === 'performance' ? 'bg-[var(--surface)] text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          Performance
        </button>
      </div>

      {tab === 'create' ? (
        <WizardShell
          initialProjectId={promoteProjectId}
          metaConnected={metaConnected}
          metaReady={metaReady}
          googleConnected={googleConnected}
          googleReady={googleReady}
          onConnectMeta={() => void handleConnect('meta')}
          connectingMeta={connecting === 'meta'}
          onLaunched={() => {
            void mutatePromotions();
            setTab('performance');
          }}
          onMessage={setPageMessage}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
          <div className="space-y-5">
            <PerformanceDashboard
              data={performance ?? null}
              loading={performanceLoading}
              selectedAdId={selectedAdId}
              onSelectAd={setSelectedAdId}
              onFilterChange={({ adType, days }) => {
                setPerfAdType(adType);
                setPerfDays(days);
              }}
            />
            {selectedAd && (
              <AdDetailView
                ad={selectedAd}
                onClose={() => setSelectedAdId(null)}
                onOptimize={() => {
                  setOptimizePromotionId(selectedAd.promotionId);
                  setOptimizeInsight(null);
                }}
              />
            )}
          </div>
          <AIInsightsFeed
            insights={insights}
            loading={insightsLoading}
            refreshing={refreshingInsights}
            onRefresh={() => void refreshInsights()}
            onDismiss={(id) => void dismissInsight(id)}
            onOptimize={openOptimize}
          />
        </div>
      )}

      <OptimizeAdFlow
        open={Boolean(optimizePromotionId)}
        promotionId={optimizePromotionId}
        insight={optimizeInsight}
        onClose={() => {
          setOptimizePromotionId(null);
          setOptimizeInsight(null);
        }}
        onApplied={() => {
          setPageMessage({
            type: 'success',
            text: 'Optimized copy saved to your ad draft — switch to Create ad to review and publish.',
          });
          setTab('create');
        }}
      />

      <section>
        <button
          type="button"
          onClick={() => setShowAccounts((v) => !v)}
          className="flex items-center gap-2 text-label hover:text-gray-700 transition-colors"
        >
          <Megaphone className="h-3.5 w-3.5" />
          Ad accounts
          <ChevronDown
            className={clsx('h-4 w-4 text-gray-400 transition-transform', showAccounts && 'rotate-180')}
          />
        </button>
        {showAccounts && (
          <div className="mt-3 space-y-3">
            <Surface flat padding="md">
              <p className="text-caption text-gray-700 max-w-2xl">
                Connect Meta to publish ads on your own ad account. If you only see “Setup required,”
                create an ad account in Meta Ads Manager with the same login, add billing, then click
                Check again. Google login is optional and used for reporting when configured.
              </p>
            </Surface>
            <AdsConnectionsPanel
              connections={connections ?? []}
              connecting={connecting}
              disconnecting={disconnecting}
              refreshing={refreshingConnection}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onRefresh={handleRefreshConnection}
            />
          </div>
        )}
      </section>
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

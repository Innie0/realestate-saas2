'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardPage from '@/components/layout/DashboardPage';
import Surface from '@/components/ui/Surface';
import AdsConnectionsPanel from '@/components/ads/AdsConnectionsPanel';
import WizardShell from '@/components/ads/wizard/WizardShell';
import ActivePromotionsPanel from '@/components/ads/ActivePromotionsPanel';
import { useApi } from '@/lib/swr';
import type { AdPlatform, AdPlatformConnection, AdPromotion } from '@/lib/ads/types';
import clsx from 'clsx';
import { ChevronDown, Megaphone } from 'lucide-react';

function AdsPageContent() {
  const searchParams = useSearchParams();
  const promoteProjectId = searchParams.get('promote');
  const [connecting, setConnecting] = useState<AdPlatform | null>(null);
  const [disconnecting, setDisconnecting] = useState<AdPlatform | null>(null);
  const [showAccounts, setShowAccounts] = useState(false);
  const [pageMessage, setPageMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const { data: connections, mutate: mutateConnections } = useApi<AdPlatformConnection[]>(
    '/api/ads/connections'
  );

  const {
    data: promotions = [],
    isLoading: promotionsLoading,
    mutate: mutatePromotions,
  } = useApi<AdPromotion[]>('/api/ads/promotions');

  useEffect(() => {
    document.title = 'Ads - Realestic';
  }, []);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'google') {
      setPageMessage({ type: 'success', text: 'Google Ads connected.' });
      void mutateConnections();
    } else if (connected === 'meta') {
      setPageMessage({ type: 'success', text: 'Meta Ads connected — you can promote a listing now.' });
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

  return (
    <DashboardPage
      title="Ads"
      subtitle="Create and publish ads in a few guided steps"
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

      <WizardShell
        initialProjectId={promoteProjectId}
        metaConnected={metaConnected}
        googleConnected={googleConnected}
        onConnectMeta={() => void handleConnect('meta')}
        connectingMeta={connecting === 'meta'}
        onLaunched={() => void mutatePromotions()}
        onMessage={setPageMessage}
      />

      <ActivePromotionsPanel promotions={promotions} loading={promotionsLoading} />

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
              <p className="text-caption text-gray-500 max-w-2xl">
                Connect Meta to run property ads. Google Ads is optional for viewing existing
                campaigns — promotion runs on Meta for now.
              </p>
            </Surface>
            <AdsConnectionsPanel
              connections={connections ?? []}
              connecting={connecting}
              disconnecting={disconnecting}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
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

'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardPage from '@/components/layout/DashboardPage';
import PageToolbar from '@/components/layout/PageToolbar';
import Button from '@/components/ui/Button';
import Surface from '@/components/ui/Surface';
import PanelHeader from '@/components/ui/PanelHeader';
import Modal from '@/components/ui/Modal';
import CalendarView from '@/components/CalendarView';
import EventForm from '@/components/EventForm';
import { Plus, RefreshCw, Settings, Link2, X } from 'lucide-react';
import { CalendarEvent } from '@/types';
import { useApi } from '@/lib/swr';
import { mutate as globalMutate } from 'swr';
import { calendarEventsPrefetchUrl } from '@/lib/dashboard-prefetch';
import clsx from 'clsx';

function CalendarPageContent() {
  const searchParams = useSearchParams();
  const linkedProjectId = searchParams.get('project_id') || undefined;
  const highlightEventId = searchParams.get('event') || undefined;

  const { data: allEvents } = useApi<CalendarEvent[]>(
    highlightEventId ? '/api/calendar/events' : null,
  );

  const focusDate = React.useMemo(() => {
    if (!highlightEventId || !allEvents?.length) return undefined;
    const match = allEvents.find((e) => e.id === highlightEventId);
    return match ? new Date(match.start_time) : undefined;
  }, [allEvents, highlightEventId]);

  const [isConnecting, setIsConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [pageMessage, setPageMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  React.useEffect(() => {
    if (linkedProjectId) setShowEventModal(true);
  }, [linkedProjectId]);

  const { data: connectionsData, mutate: mutateConnections } = useApi<
    Array<{ provider: string; is_active?: boolean; email?: string }>
  >('/api/calendar/connections');

  const connections = useMemo(() => {
    const googleConn = connectionsData?.find((c) => c.provider === 'google');
    return {
      google: {
        connected: !!googleConn?.is_active,
        email: googleConn?.email || '',
      },
    };
  }, [connectionsData]);

  React.useEffect(() => {
    document.title = 'Calendar - Oikaro';
  }, []);

  React.useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      void handleRefresh(true);
    }, 3000);
    const syncInterval = setInterval(() => handleRefresh(true), 5 * 60 * 1000);
    return () => {
      clearTimeout(syncTimer);
      clearInterval(syncInterval);
    };
  }, []);

  const handleCreateEvent = async (eventData: Partial<CalendarEvent>) => {
    setIsCreatingEvent(true);
    setPageMessage(null);
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });
      const data = await response.json();
      if (data.success) {
        setShowEventModal(false);
        void globalMutate(calendarEventsPrefetchUrl());
        setPageMessage({ type: 'success', text: 'Event created successfully.' });
      } else {
        setPageMessage({ type: 'error', text: data.error || 'Failed to create event.' });
      }
    } catch (error) {
      console.error('Create event error:', error);
      setPageMessage({ type: 'error', text: 'Failed to create event. Please try again.' });
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setPageMessage(null);
    try {
      const response = await fetch('/api/calendar/google/connect', { method: 'POST' });
      const data = await response.json();
      if (data.success && data.data?.authUrl) {
        window.location.href = data.data.authUrl;
      } else {
        setPageMessage({ type: 'error', text: 'Failed to connect to Google Calendar. Please try again.' });
      }
    } catch (error) {
      console.error('Google Calendar connection error:', error);
      setPageMessage({ type: 'error', text: 'Failed to connect to Google Calendar. Please try again.' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (provider: 'google') => {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) return;
    try {
      const response = await fetch(`/api/calendar/${provider}/disconnect`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        void mutateConnections();
        setPageMessage({ type: 'success', text: 'Google Calendar disconnected.' });
      } else {
        setPageMessage({ type: 'error', text: 'Failed to disconnect calendar.' });
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      setPageMessage({ type: 'error', text: 'Failed to disconnect calendar.' });
    }
  };

  const handleRefresh = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const response = await fetch('/api/calendar/sync', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        void globalMutate(calendarEventsPrefetchUrl());
        if (!silent) setTimeout(() => setRefreshing(false), 1000);
      } else if (!silent) {
        setRefreshing(false);
      }
    } catch (error) {
      console.error('Refresh error:', error);
      if (!silent) setRefreshing(false);
    }
  };

  return (
    <DashboardPage title="Calendar" subtitle="Showings, closings, and synced Google Calendar events">
      {pageMessage && (
        <Surface
          flat
          padding="none"
          className={clsx(
            'flex items-center justify-between gap-3 px-4 py-3 text-[13px]',
            pageMessage.type === 'error'
              ? 'bg-rose-50/80 text-rose-800 border-rose-200'
              : 'bg-emerald-50/80 text-emerald-800 border-emerald-200',
          )}
        >
          <span>{pageMessage.text}</span>
          <button
            type="button"
            onClick={() => setPageMessage(null)}
            className="p-1 rounded hover:bg-black/5 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </Surface>
      )}

      {!connections.google.connected ? (
        <Surface flat padding="md" className="border-brand-200/60 bg-brand-50/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-[10px] bg-[var(--surface)] border border-[var(--border)]">
                <Link2 className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Connect Google Calendar</p>
                <p className="text-[13px] text-gray-700 mt-0.5 leading-relaxed">
                  Sync showings and closings automatically. You can still add events here without connecting.
                </p>
              </div>
            </div>
            <Button onClick={handleConnectGoogle} disabled={isConnecting} className="shrink-0">
              {isConnecting ? 'Connecting…' : 'Connect Google'}
            </Button>
          </div>
        </Surface>
      ) : (
        <Surface flat padding="none" className="overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-gray-900 truncate">
                  Synced with {connections.google.email || 'Google Calendar'}
                </p>
                <p className="text-[12px] text-gray-600">Auto-syncs every 5 minutes</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRefresh()}
              disabled={refreshing}
              className="inline-flex items-center gap-2 self-start sm:self-auto rounded-[8px] border border-[var(--border)] bg-[var(--canvas)] px-3 py-2 text-[13px] font-medium text-gray-700 hover:bg-[var(--surface)] transition-colors disabled:opacity-60"
            >
              <RefreshCw className={clsx('w-4 h-4', refreshing && 'animate-spin')} />
              {refreshing ? 'Syncing…' : 'Sync now'}
            </button>
          </div>
        </Surface>
      )}

      <PageToolbar>
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => setShowConnectionsModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-[13px] text-gray-600 hover:text-gray-900 hover:bg-[var(--canvas)] rounded-[8px] transition-colors"
          >
            <Settings className="w-4 h-4" />
            Connections
          </button>
          <Button size="sm" onClick={() => setShowEventModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New event
          </Button>
        </div>
      </PageToolbar>

      <Surface flat padding="none" className="overflow-hidden">
        <PanelHeader title="Schedule" meta="Month view" />
        <div className="p-4 sm:p-5">
          <CalendarView highlightEventId={highlightEventId} focusDate={focusDate} />
        </div>
      </Surface>

      {showEventModal && (
        <Modal isOpen={showEventModal} onClose={() => setShowEventModal(false)} title="Create New Event">
          <EventForm
            onSubmit={handleCreateEvent}
            onCancel={() => setShowEventModal(false)}
            isLoading={isCreatingEvent}
            initialData={linkedProjectId ? { project_id: linkedProjectId } : undefined}
          />
        </Modal>
      )}

      <Modal isOpen={showConnectionsModal} onClose={() => setShowConnectionsModal(false)} title="Calendar Connections">
        <div className="space-y-4">
          <p className="text-[13px] text-gray-700 leading-relaxed">
            Connect your calendars to sync events automatically.
          </p>
          <Surface flat padding="md">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-[10px] bg-[var(--canvas)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 48 48" aria-hidden>
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">Google Calendar</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {connections.google.connected ? (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <p className="text-[12px] text-gray-700 truncate">{connections.google.email}</p>
                      </>
                    ) : (
                      <p className="text-[12px] text-gray-600">Not connected</p>
                    )}
                  </div>
                </div>
              </div>
              {connections.google.connected ? (
                <Button size="sm" variant="outline" onClick={() => handleDisconnect('google')}>
                  Disconnect
                </Button>
              ) : (
                <Button size="sm" onClick={handleConnectGoogle} disabled={isConnecting}>
                  Connect
                </Button>
              )}
            </div>
          </Surface>
          <p className="text-[12px] text-gray-600 leading-relaxed">
            Events created here sync to your connected calendars, and external events appear in your schedule.
          </p>
        </div>
      </Modal>
    </DashboardPage>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={null}>
      <CalendarPageContent />
    </Suspense>
  );
}

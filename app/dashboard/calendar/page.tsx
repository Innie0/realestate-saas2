'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardPage from '@/components/layout/DashboardPage';
import PageToolbar from '@/components/layout/PageToolbar';
import Button from '@/components/ui/Button';
import Surface from '@/components/ui/Surface';
import Modal from '@/components/ui/Modal';
import CalendarView from '@/components/CalendarView';
import EventForm from '@/components/EventForm';
import { Plus, RefreshCw, Settings, Link2, X } from 'lucide-react';
import { CalendarEvent } from '@/types';
import { useApi } from '@/lib/swr';
import { mutate as globalMutate } from 'swr';
import { calendarEventsPrefetchUrl } from '@/lib/dashboard-prefetch';

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

  // Deep-linked from a project's "Linked" tab — open the create-event modal
  // pre-associated with that project.
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
    document.title = 'Calendar - Realestic';
  }, []);

  React.useEffect(() => {
    handleRefresh(true);
    const syncInterval = setInterval(() => handleRefresh(true), 5 * 60 * 1000);
    return () => clearInterval(syncInterval);
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
        <div
          className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm ${
            pageMessage.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}
        >
          <span>{pageMessage.text}</span>
          <button type="button" onClick={() => setPageMessage(null)} className="p-1 rounded hover:bg-black/5" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!connections.google.connected && (
        <Surface padding="md" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-50/30">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white shadow-sm">
              <Link2 className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Connect Google Calendar</p>
              <p className="text-sm text-gray-600 mt-0.5">
                Sync showings and closings automatically. You can still add events here without connecting.
              </p>
            </div>
          </div>
          <Button onClick={handleConnectGoogle} disabled={isConnecting} className="shrink-0">
            {isConnecting ? 'Connecting…' : 'Connect Google'}
          </Button>
        </Surface>
      )}

      <PageToolbar>
        {connections.google.connected && (
          <span className="mr-auto flex items-center gap-1.5 text-xs text-gray-500 order-first sm:order-none w-full sm:w-auto">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Synced with {connections.google.email || 'Google Calendar'}
          </span>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => handleRefresh()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
            title="Sync calendars"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Sync
          </button>
          <button
            type="button"
            onClick={() => setShowConnectionsModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <Button size="sm" onClick={() => setShowEventModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </div>
      </PageToolbar>

      <Surface padding="md">
        <CalendarView highlightEventId={highlightEventId} focusDate={focusDate} />
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
          <p className="text-sm text-gray-500">Connect your calendars to sync events automatically.</p>
          <Surface padding="md" className="shadow-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Google Calendar</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {connections.google.connected ? (
                      <>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <p className="text-xs text-gray-500">{connections.google.email}</p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">Not connected</p>
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
          <p className="text-xs text-gray-500">
            Events created here will sync to your connected calendars, and calendar events will appear in your schedule.
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

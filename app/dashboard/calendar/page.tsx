'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardPage from '@/components/layout/DashboardPage';
import FilterSidebar from '@/components/layout/FilterSidebar';
import ListPageToolbar from '@/components/layout/ListPageToolbar';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import PanelHeader from '@/components/ui/PanelHeader';
import Modal from '@/components/ui/Modal';
import CalendarView from '@/components/CalendarView';
import EventForm from '@/components/EventForm';
import { Plus, RefreshCw, Link2, X, Filter } from 'lucide-react';
import { CalendarEvent } from '@/types';
import { useApi } from '@/lib/swr';
import { mutate as globalMutate } from 'swr';
import { calendarEventsPrefetchUrl } from '@/lib/dashboard-prefetch';
import clsx from 'clsx';
import { cn } from '@/lib/utils';
import { CalendarPageContentSkeleton } from '@/components/dashboard/page-loading';

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
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [pageMessage, setPageMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const EVENT_TYPE_OPTIONS = [
    { value: '', label: 'All events' },
    { value: 'showing', label: 'Property showing' },
    { value: 'open_house', label: 'Open house' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'other', label: 'Other' },
  ] as const;

  React.useEffect(() => {
    if (linkedProjectId) setShowEventModal(true);
  }, [linkedProjectId]);

  const { data: connectionsData, isLoading: connectionsLoading, mutate: mutateConnections } = useApi<
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
        <Card className={clsx(
            'flex items-center justify-between gap-3 px-4 py-3 text-[13px]',
            pageMessage.type === 'error'
              ? 'bg-rose-50/80 text-rose-800 border-rose-200'
              : 'bg-emerald-50/80 text-emerald-800 border-emerald-200',
          )}>
          <span>{pageMessage.text}</span>
          <button
            type="button"
            onClick={() => setPageMessage(null)}
            className="p-1 rounded hover:bg-black/5 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </Card>
      )}

      {connectionsLoading ? (
        <CalendarPageContentSkeleton />
      ) : (
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <FilterSidebar
            title="Filters"
            className="lg:sticky lg:top-24"
            groups={[
              {
                id: 'event-type',
                label: 'Event type',
                icon: Filter,
                defaultOpen: true,
                children: (
                  <div className="space-y-1">
                    {EVENT_TYPE_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value || 'all'}
                        type="button"
                        onClick={() => setEventTypeFilter(value)}
                        className={cn(
                          'flex w-full items-center rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
                          eventTypeFilter === value
                            ? 'bg-foreground text-background'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ),
              },
              {
                id: 'sync',
                label: 'Google Calendar',
                icon: Link2,
                defaultOpen: !connections.google.connected,
                children: (
                  <div className="space-y-3">
                    {connections.google.connected ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="relative flex size-2 shrink-0">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                          </span>
                          <p className="truncate text-[12px] font-medium text-foreground">
                            {connections.google.email || 'Connected'}
                          </p>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Auto-syncs every 5 minutes</p>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRefresh()}
                            disabled={refreshing}
                            className="w-full"
                          >
                            <RefreshCw className={clsx('size-4', refreshing && 'animate-spin')} />
                            {refreshing ? 'Syncing…' : 'Sync now'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDisconnect('google')} className="w-full">
                            Disconnect
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-[12px] leading-relaxed text-muted-foreground">
                          Sync showings and closings automatically. You can still add events without connecting.
                        </p>
                        <Button onClick={handleConnectGoogle} disabled={isConnecting} size="sm" className="w-full">
                          {isConnecting ? 'Connecting…' : 'Connect Google'}
                        </Button>
                      </>
                    )}
                  </div>
                ),
              },
            ]}
          />

          <div className="min-w-0 flex-1 space-y-5">
            <ListPageToolbar
              addButton={
                <Button size="sm" onClick={() => setShowEventModal(true)} className="whitespace-nowrap">
                  <Plus className="size-4" />
                  New event
                </Button>
              }
            />

            <Card className="overflow-hidden border-border shadow-none">
              <PanelHeader title="Schedule" meta="Month view" />
              <div className="p-4 sm:p-5">
                <CalendarView
                  highlightEventId={highlightEventId}
                  focusDate={focusDate}
                  eventTypeFilter={eventTypeFilter}
                />
              </div>
            </Card>
          </div>
        </div>
      )}

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

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { Bell, Clock, Calendar, X, ArrowRight } from 'lucide-react';
import Surface from './ui/Surface';
import Card from './ui/Card';

interface UpcomingItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: 'reminder' | 'event';
  clientName?: string;
  location?: string;
  eventType?: string;
}

interface NotificationsPanelProps {
  /** Render inside dashboard Today layout — no outer card, tighter rows */
  embedded?: boolean;
  className?: string;
}

export default function NotificationsPanel({ embedded = false, className }: NotificationsPanelProps) {
  const [items, setItems] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingItems();
  }, []);

  const fetchUpcomingItems = async () => {
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const sevenDaysFromNow = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

      const [remindersResponse, eventsResponse] = await Promise.all([
        fetch('/api/reminders?include_completed=false'),
        fetch('/api/calendar/events'),
      ]);
      const [remindersResult, eventsResult] = await Promise.all([
        remindersResponse.json(),
        eventsResponse.json(),
      ]);

      const upcomingItems: UpcomingItem[] = [];

      if (remindersResult.success) {
        upcomingItems.push(
          ...remindersResult.data
            .filter((reminder: { reminder_date: string }) => {
              const reminderDate = new Date(reminder.reminder_date);
              return reminderDate >= startOfToday && reminderDate <= sevenDaysFromNow;
            })
            .map((reminder: {
              id: string;
              title: string;
              description?: string;
              reminder_date: string;
              clients?: { name?: string };
            }) => ({
              id: `reminder-${reminder.id}`,
              title: reminder.title,
              description: reminder.description,
              date: reminder.reminder_date,
              type: 'reminder' as const,
              clientName: reminder.clients?.name,
            })),
        );
      }

      if (eventsResult.success) {
        upcomingItems.push(
          ...eventsResult.data
            .filter((event: { start_time: string }) => {
              const eventDate = new Date(event.start_time);
              return eventDate >= startOfToday && eventDate <= sevenDaysFromNow;
            })
            .map((event: {
              id: string;
              title: string;
              description?: string;
              start_time: string;
              location?: string;
              event_type?: string;
            }) => ({
              id: `event-${event.id}`,
              title: event.title,
              description: event.description,
              date: event.start_time,
              type: 'event' as const,
              location: event.location,
              eventType: event.event_type,
            })),
        );
      }

      upcomingItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setItems(upcomingItems);
    } catch (error) {
      console.error('Error fetching upcoming items:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortByDate = (list: UpcomingItem[]) =>
    [...list].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const restoreItem = (item: UpcomingItem) => {
    setItems((prev) => sortByDate([...prev, item]));
  };

  const handleComplete = async (itemId: string) => {
    if (!itemId.startsWith('reminder-')) return;
    const id = itemId.replace('reminder-', '');
    let previous: UpcomingItem | undefined;
    setItems((prev) => {
      previous = prev.find((i) => i.id === itemId);
      return prev.filter((i) => i.id !== itemId);
    });
    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: true }),
      });
      if (!response.ok && previous) restoreItem(previous);
    } catch (error) {
      console.error('Error completing reminder:', error);
      if (previous) restoreItem(previous);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    let previous: UpcomingItem | undefined;
    setItems((prev) => {
      previous = prev.find((i) => i.id === itemId);
      return prev.filter((i) => i.id !== itemId);
    });
    try {
      let response: Response | null = null;
      if (itemId.startsWith('reminder-')) {
        response = await fetch(`/api/reminders/${itemId.replace('reminder-', '')}`, { method: 'DELETE' });
      } else if (itemId.startsWith('event-')) {
        response = await fetch(`/api/calendar/events/${itemId.replace('event-', '')}`, { method: 'DELETE' });
      }
      if (response && !response.ok && previous) restoreItem(previous);
    } catch (error) {
      console.error('Error deleting item:', error);
      if (previous) restoreItem(previous);
    }
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatWhen = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (isToday(dateString)) return `Today · ${time}`;
    if (date.toDateString() === tomorrow.toDateString()) return `Tomorrow · ${time}`;
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const todayCount = items.filter((i) => isToday(i.date)).length;

  const header = (
    <div className="flex items-center justify-between gap-3 mb-5">
      <div>
        <p className="text-label mb-1">Schedule</p>
        <h2 className="text-title font-semibold tracking-tight text-gray-900">
          {embedded ? 'Coming up' : 'Upcoming events & reminders'}
        </h2>
      </div>
      {items.length > 0 && (
        <span className="text-caption text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          {embedded && todayCount > 0 ? `${todayCount} today` : `${items.length} this week`}
        </span>
      )}
    </div>
  );

  const listContent = loading ? (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 bg-gray-100 rounded-xl" />
      ))}
    </div>
  ) : items.length === 0 ? (
    <div className="py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-3">
        <Calendar className="w-8 h-8 text-gray-300 shrink-0" />
        <div>
          <p className="text-body text-gray-700 font-medium">Nothing scheduled this week</p>
          <p className="text-caption text-gray-500 mt-0.5">Add a reminder or event to keep your day on track.</p>
        </div>
      </div>
      <Link
        href="/dashboard/calendar"
        className="inline-flex items-center justify-center gap-1.5 text-caption font-medium text-brand-600 hover:text-brand-700 shrink-0"
      >
        Open calendar <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  ) : (
    <div className={embedded ? 'divide-y divide-gray-100' : 'space-y-2'}>
      {items.map((item) => (
        <div
          key={item.id}
          className={clsx(
            'group flex items-start gap-3 transition-colors',
            embedded ? 'py-3.5 first:pt-0 last:pb-0' : 'p-3 rounded-xl bg-gray-50 hover:bg-gray-100/80',
          )}
        >
          <div
            className={clsx(
              'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              item.type === 'reminder' ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600',
            )}
          >
            {item.type === 'reminder' ? <Bell className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-body font-medium text-gray-900">{item.title}</p>
              {isToday(item.date) && (
                <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                  Today
                </span>
              )}
            </div>
            {item.description && (
              <p className="text-caption text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 text-caption text-gray-500 flex-wrap">
              <Clock className="w-3 h-3 shrink-0" />
              <span>{formatWhen(item.date)}</span>
              {item.clientName && <span>· {item.clientName}</span>}
              {item.location && <span className="truncate">· {item.location}</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => (item.type === 'reminder' ? handleComplete(item.id) : handleDelete(item.id))}
            className="p-1.5 rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-600 transition-all shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );

  if (embedded) {
    return (
      <Surface padding="md" className={className}>
        {header}
        {listContent}
      </Surface>
    );
  }

  return (
    <Card className={className}>
      {header}
      {listContent}
    </Card>
  );
}

// CalendarView component - Displays calendar grid with events
// Shows monthly view with events and allows creating new events

'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, Trash2, CalendarDays } from 'lucide-react';
import { CalendarEvent } from '@/types';
import Button from './ui/Button';
import { useApi } from '@/lib/swr';
import { useToast } from '@/components/providers/ToastProvider';

const EVENT_STYLES: Record<string, { dot: string; pill: string }> = {
  showing: { dot: 'bg-sky-500', pill: 'bg-sky-50 text-sky-700 border-sky-200' },
  open_house: { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  meeting: { dot: 'bg-brand-500', pill: 'bg-brand-50 text-brand-700 border-brand-200' },
  other: { dot: 'bg-gray-400', pill: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const LEGEND = [
  { key: 'showing', label: 'Property showing' },
  { key: 'open_house', label: 'Open house' },
  { key: 'meeting', label: 'Meeting' },
  { key: 'other', label: 'Other' },
] as const;

function eventStyle(eventType: string) {
  return EVENT_STYLES[eventType] || EVENT_STYLES.other;
}

/**
 * CalendarView component
 * Monthly calendar grid with events
 */
export default function CalendarView() {
  const toast = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const eventsUrl = `/api/calendar/events?month=${month}&year=${year}`;
  const { data: events = [], isLoading, mutate } = useApi<CalendarEvent[]>(eventsUrl);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const previousMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Delete "${eventTitle}"?\n\nThis will also remove it from Google Calendar if synced.`)) {
      return;
    }

    setDeletingEventId(eventId);

    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        void mutate(
          (current) =>
            current?.data
              ? { ...current, data: current.data.filter((e) => e.id !== eventId) }
              : current,
          { revalidate: false },
        );
      } else {
        toast.error(data.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Delete event error:', error);
      toast.error('Failed to delete event. Please try again.');
    } finally {
      setDeletingEventId(null);
    }
  };

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.getDate() === day &&
             eventDate.getMonth() === month &&
             eventDate.getFullYear() === year;
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="min-h-[92px] sm:min-h-[110px] bg-gray-50/60" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    const isToday =
      day === new Date().getDate() &&
      month === new Date().getMonth() &&
      year === new Date().getFullYear();

    days.push(
      <div
        key={day}
        className={`min-h-[92px] sm:min-h-[110px] border-t border-l border-gray-100 p-1.5 sm:p-2 transition-colors hover:bg-gray-50 ${
          isToday ? 'bg-brand-50/60' : 'bg-white'
        }`}
      >
        <div
          className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-xs font-semibold mb-1 ${
            isToday ? 'bg-brand-500 text-white' : 'text-gray-700'
          }`}
        >
          {day}
        </div>
        <div className="space-y-1">
          {dayEvents.slice(0, 3).map(event => {
            const style = eventStyle(event.event_type);
            return (
              <div
                key={event.id}
                className={`group relative text-[11px] px-1.5 py-1 rounded-md border ${style.pill}`}
              >
                <div className="flex items-center gap-1 font-medium truncate pr-4">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
                  <span className="truncate">{event.title}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] mt-0.5 opacity-80 pl-2.5">
                  <Clock className="w-2.5 h-2.5 shrink-0" />
                  <span>{formatTime(event.start_time)}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEvent(event.id, event.title);
                  }}
                  disabled={deletingEventId === event.id}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-black/10 rounded"
                  title="Delete event"
                >
                  {deletingEventId === event.id ? (
                    <div className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-2.5 h-2.5" />
                  )}
                </button>
              </div>
            );
          })}
          {dayEvents.length > 3 && (
            <p className="text-[10px] text-gray-400 pl-0.5">+{dayEvents.length - 3} more</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-title font-semibold tracking-tight text-gray-900 min-w-[9rem] sm:min-w-[11rem]">
            {monthNames[month]} {year}
          </h3>
          <Button size="sm" variant="outline" onClick={goToToday}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={previousMonth} aria-label="Previous month">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={nextMonth} aria-label="Next month">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4 text-xs text-gray-500">
        {LEGEND.map((item) => (
          <div key={item.key} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${eventStyle(item.key).dot}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-7 gap-px rounded-xl border border-gray-100 overflow-hidden animate-pulse">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-[92px] sm:min-h-[110px] bg-gray-50" />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${year}-${month}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            <div className="grid grid-cols-7 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-400 py-1.5">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 border-r border-b border-gray-100 rounded-xl overflow-hidden">
              {days}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {!isLoading && events.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm text-gray-500">No events scheduled for this month</p>
          <p className="text-xs mt-1">Create your first event or connect a calendar to sync events</p>
        </div>
      )}
    </div>
  );
}

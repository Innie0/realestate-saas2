// CalendarView component - Displays calendar grid with events
// Shows monthly view with events and allows creating new events

'use client'; // This component uses client-side features

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Trash2 } from 'lucide-react';
import { CalendarEvent } from '@/types';
import Button from './ui/Button';

/**
 * CalendarView component
 * Monthly calendar grid with events
 */
export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Get calendar display data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  /**
   * Load events from API
   */
  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      // Fetch real events from API
      const response = await fetch(`/api/calendar/events?month=${month}&year=${year}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setEvents(data.data);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Navigate to previous month
   */
  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  /**
   * Navigate to next month
   */
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  /**
   * Go to today
   */
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  /**
   * Delete an event
   */
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
        // Remove from local state
        setEvents(events.filter(e => e.id !== eventId));
      } else {
        alert(data.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Delete event error:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setDeletingEventId(null);
    }
  };

  /**
   * Get days in month
   */
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  /**
   * Get first day of month (0 = Sunday, 6 = Saturday)
   */
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  /**
   * Get events for a specific day
   */
  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.getDate() === day &&
             eventDate.getMonth() === month &&
             eventDate.getFullYear() === year;
    });
  };

  /**
   * Format time for display
   */
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  /**
   * Get event type color
   */
  const getEventColor = (eventType: string) => {
    const colors = {
      showing: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      open_house: 'bg-green-500/20 text-green-300 border-green-500/30',
      meeting: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      other: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    };
    return colors[eventType as keyof typeof colors] || colors.other;
  };

  // Generate calendar days
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const days = [];

  // Add empty cells for days before the first day of month
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="min-h-[100px] bg-gray-900/30"></div>);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day);
    const isToday = 
      day === new Date().getDate() &&
      month === new Date().getMonth() &&
      year === new Date().getFullYear();

    days.push(
      <div
        key={day}
        className={`min-h-[100px] border border-gray-700/50 p-2 ${
          isToday ? 'bg-purple-500/20' : 'bg-gray-800/30'
        } hover:bg-gray-700/30 cursor-pointer transition-colors`}
      >
        <div className={`text-sm font-semibold mb-1 ${
          isToday ? 'text-primary-600' : 'text-white'
        }`}>
          {day}
        </div>
        <div className="space-y-1">
          {dayEvents.map(event => (
            <div
              key={event.id}
              className={`text-xs p-1 rounded border group relative ${getEventColor(event.event_type)}`}
            >
              <div className="font-medium truncate pr-6">{event.title}</div>
              <div className="flex items-center gap-1 text-[10px] mt-0.5">
                <Clock className="w-2.5 h-2.5" />
                <span>{formatTime(event.start_time)}</span>
              </div>
              
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteEvent(event.id, event.title);
                }}
                disabled={deletingEventId === event.id}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-500/20 rounded"
                title="Delete event"
              >
                {deletingEventId === event.id ? (
                  <div className="w-3 h-3 border border-red-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Trash2 className="w-3 h-3 text-red-600" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-2xl font-bold text-white">
            {monthNames[month]} {year}
          </h3>
          <Button size="sm" variant="outline" onClick={goToToday}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={previousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Event type legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/30"></div>
          <span className="text-gray-400">Property Showing</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30"></div>
          <span className="text-gray-400">Open House</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500/30"></div>
          <span className="text-gray-400">Meeting</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-500/20 border border-gray-500/30"></div>
          <span className="text-gray-400">Other</span>
        </div>
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading calendar...</p>
        </div>
      ) : (
        <div>
          {/* Day names header */}
          <div className="grid grid-cols-7 gap-0 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-0 border border-gray-700/50 rounded-lg overflow-hidden">
            {days}
          </div>
        </div>
      )}

      {/* No events message */}
      {!isLoading && events.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>No events scheduled for this month</p>
          <p className="text-sm mt-1">Create your first event or connect a calendar to sync events</p>
        </div>
      )}
    </div>
  );
}



'use client';

import { useEffect, useState } from 'react';
import { Reminder } from '@/types';
import { Bell, Clock, CheckCircle, Trash2, Calendar } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';

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

/**
 * NotificationsPanel component
 * Displays upcoming reminders and calendar events in the next 7 days
 */
export default function NotificationsPanel() {
  const [items, setItems] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch upcoming reminders and events
  useEffect(() => {
    fetchUpcomingItems();
  }, []);

  const fetchUpcomingItems = async () => {
    try {
      // Start from beginning of today (midnight)
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const sevenDaysFromNow = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Fetch reminders
      const remindersResponse = await fetch('/api/reminders?include_completed=false');
      const remindersResult = await remindersResponse.json();

      // Fetch calendar events
      const eventsResponse = await fetch('/api/calendar/events');
      const eventsResult = await eventsResponse.json();

      const upcomingItems: UpcomingItem[] = [];

      // Process reminders
      if (remindersResult.success) {
        const upcomingReminders = remindersResult.data
          .filter((reminder: any) => {
            const reminderDate = new Date(reminder.reminder_date);
            return reminderDate >= startOfToday && reminderDate <= sevenDaysFromNow;
          })
          .map((reminder: any) => ({
            id: `reminder-${reminder.id}`,
            title: reminder.title,
            description: reminder.description,
            date: reminder.reminder_date,
            type: 'reminder' as const,
            clientName: reminder.clients?.name,
          }));
        
        upcomingItems.push(...upcomingReminders);
      }

      // Process calendar events
      if (eventsResult.success) {
        const upcomingEvents = eventsResult.data
          .filter((event: any) => {
            const eventDate = new Date(event.start_time);
            return eventDate >= startOfToday && eventDate <= sevenDaysFromNow;
          })
          .map((event: any) => ({
            id: `event-${event.id}`,
            title: event.title,
            description: event.description,
            date: event.start_time,
            type: 'event' as const,
            location: event.location,
            eventType: event.event_type,
          }));
        
        upcomingItems.push(...upcomingEvents);
      }

      // Sort by date
      upcomingItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      setItems(upcomingItems);
    } catch (error) {
      console.error('Error fetching upcoming items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (itemId: string) => {
    // Only reminders can be completed
    if (!itemId.startsWith('reminder-')) return;
    
    const id = itemId.replace('reminder-', '');
    
    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: true }),
      });

      if (response.ok) {
        fetchUpcomingItems();
      }
    } catch (error) {
      console.error('Error completing reminder:', error);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      if (itemId.startsWith('reminder-')) {
        const id = itemId.replace('reminder-', '');
        const response = await fetch(`/api/reminders/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchUpcomingItems();
        }
      } else if (itemId.startsWith('event-')) {
        const id = itemId.replace('event-', '');
        const response = await fetch(`/api/calendar/events/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchUpcomingItems();
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Helper function to check if a date is today
  const isToday = (dateString: string): boolean => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-700 rounded w-1/3"></div>
          <div className="h-3 bg-gray-700 rounded"></div>
          <div className="h-3 bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-blue-400" />
        <h2 className="text-lg font-semibold text-white">Upcoming Events & Reminders</h2>
        {items.length > 0 && (
          <span className="ml-auto bg-blue-500/20 text-blue-300 text-xs font-medium px-2 py-1 rounded-full border border-blue-400/30">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-gray-400 text-sm">No upcoming events or reminders in the next 7 days.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {item.type === 'reminder' ? (
                      <Bell className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    )}
                    <h3 className="font-medium text-white text-sm">{item.title}</h3>
                    {isToday(item.date) && (
                      <span className="text-xs font-bold bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded border border-orange-400/30">
                        Today
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(item.date).toLocaleString()}
                    </div>
                    {item.clientName && (
                      <div className="text-xs text-gray-400">
                        Client: {item.clientName}
                      </div>
                    )}
                    {item.location && (
                      <div className="text-xs text-gray-400">
                        📍 {item.location}
                      </div>
                    )}
                    {item.eventType && (
                      <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-400/30">
                        {item.eventType}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {item.type === 'reminder' && (
                    <button
                      onClick={() => handleComplete(item.id)}
                      className="p-1 hover:bg-green-500/20 rounded transition-colors"
                      title="Mark as complete"
                    >
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                    title={item.type === 'reminder' ? 'Delete reminder' : 'Delete event'}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}








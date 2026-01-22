// Header component - Top navigation bar for the dashboard
// Displays page title and user profile information

'use client'; // This component uses client-side features

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, Calendar, CheckCircle, X } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase';

/**
 * HeaderProps - Props for the Header component
 */
interface HeaderProps {
  title: string; // Page title to display
  subtitle?: string; // Optional subtitle/description
}

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
 * Header component
 * Top bar that shows the current page title and user actions
 */
export default function Header({ title, subtitle }: HeaderProps) {
  const [userName, setUserName] = useState('User');
  const [userEmail, setUserEmail] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Load user data on mount
  useEffect(() => {
    loadUserData();
    fetchNotifications();
  }, []);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showNotifications]);

  const loadUserData = async () => {
    try {
      const { user } = await getCurrentUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || 'User');
        setUserEmail(user.email || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
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
      
      setNotifications(upcomingItems);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (itemId: string) => {
    if (!itemId.startsWith('reminder-')) return;
    
    const id = itemId.replace('reminder-', '');
    
    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: true }),
      });

      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error completing reminder:', error);
    }
  };

  const isToday = (dateString: string): boolean => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (isToday(dateString)) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
  };
  return (
    <header className="sticky top-0 z-20 backdrop-blur-md bg-gray-900/50 border-b border-white/10">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Page title and subtitle */}
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-400">{subtitle}</p>
          )}
        </div>

        {/* Right side - Notifications */}
        <div className="flex items-center gap-4">
          {/* Notifications button */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {/* Notification badge - shows when there are unread notifications */}
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 max-h-[32rem] overflow-y-auto bg-gray-900 border border-gray-700/50 rounded-lg shadow-2xl shadow-black/50">
                <div className="sticky top-0 bg-gray-900 border-b border-gray-700/50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-400" />
                    <h3 className="font-semibold text-white">Notifications</h3>
                    {notifications.length > 0 && (
                      <span className="bg-blue-500/20 text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full border border-blue-400/30">
                        {notifications.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-2">
                  {loading ? (
                    <div className="animate-pulse space-y-3 p-3">
                      <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-800 rounded"></div>
                      <div className="h-3 bg-gray-800 rounded w-5/6"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No upcoming events or reminders</p>
                      <p className="text-xs mt-1">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-gray-600 hover:bg-gray-800/50 transition-all"
                        >
                          <div className="flex items-start gap-2">
                            {item.type === 'reminder' ? (
                              <Bell className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Calendar className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-white text-sm leading-tight">
                                  {item.title}
                                </h4>
                                {item.type === 'reminder' && (
                                  <button
                                    onClick={() => handleComplete(item.id)}
                                    className="p-1 hover:bg-green-500/20 rounded transition-colors flex-shrink-0"
                                    title="Mark as complete"
                                  >
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                  </button>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(item.date)}</span>
                                {isToday(item.date) && (
                                  <span className="bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded border border-orange-400/30 font-medium">
                                    Today
                                  </span>
                                )}
                              </div>
                              {(item.clientName || item.location) && (
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                  {item.clientName && <span>👤 {item.clientName}</span>}
                                  {item.location && <span>📍 {item.location}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User profile section */}
          <div className="flex items-center gap-3 ml-4">
            {/* User avatar - shows initials */}
            <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-sm font-medium border border-white/20">
              {userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-white">{userName}</p>
              <p className="text-xs text-gray-400">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


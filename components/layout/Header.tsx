// Header component - Top navigation bar for the dashboard
// Displays page title and user profile information

'use client'; // This component uses client-side features

import React, { useState, useEffect, useRef } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { Bell, Clock, Calendar, X, User, MapPin } from 'lucide-react';
import { fetchUpcomingItems, type UpcomingItem } from '@/components/NotificationsPanel';
import { DASHBOARD_UPCOMING_KEY } from '@/lib/dashboard-prefetch';
import UsageStatusPill from '@/components/dashboard/UsageStatusPill';

/**
 * HeaderProps - Props for the Header component
 */
interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  /** Baseline-aligned title + subtitle on one line (e.g. dashboard home greeting). */
  inline?: boolean;
}

const titleClass =
  'dashboard-page-title font-display text-[1.125rem] font-medium tracking-[-0.02em] text-foreground truncate sm:text-title sm:font-semibold';
const subtitleInlineClass = 'text-caption text-muted-foreground truncate';

/**
 * Header component
 * Top bar that shows the current page title and user actions
 */
export default function Header({ title, subtitle, actions, inline = false }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const {
    data: notifications = [],
    isLoading: loading,
    mutate: mutateNotifications,
  } = useSWR<UpcomingItem[]>(DASHBOARD_UPCOMING_KEY, fetchUpcomingItems, {
    revalidateOnFocus: false,
    dedupingInterval: 120_000,
  });

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

  const handleComplete = async (itemId: string) => {
    if (!itemId.startsWith('reminder-')) return;

    const id = itemId.replace('reminder-', '');
    let previous: UpcomingItem[] = notifications;
    await mutateNotifications(
      notifications.filter((i) => i.id !== itemId),
      { revalidate: false },
    );

    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: true }),
      });

      if (!response.ok) {
        await mutateNotifications(previous, { revalidate: false });
      }
    } catch (error) {
      console.error('Error completing reminder:', error);
      await mutateNotifications(previous, { revalidate: false });
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
    <header className="sticky top-0 z-20 border-b border-border bg-[var(--canvas)]/95 backdrop-blur-md">
      <div className="px-4 sm:px-7 py-2.5 sm:h-[52px] sm:py-0">
        <div className="flex h-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {inline ? (
            <div className="flex min-w-0 flex-1 items-baseline gap-2.5">
              <h1 className={titleClass}>{title}</h1>
              {subtitle && <span className={subtitleInlineClass}>{subtitle}</span>}
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <h1 className={titleClass}>{title}</h1>
              {subtitle && (
                <p className="text-caption text-muted-foreground mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            {actions && (
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            )}

            <div className="flex items-center gap-2 sm:gap-3">
              <UsageStatusPill className="hidden sm:inline-flex" />
          {/* Notifications button */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {/* Notification badge - shows when there are unread notifications */}
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white"></span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 max-h-[32rem] w-96 overflow-y-auto rounded-xl bg-card shadow-overlay ring-1 ring-border">
                <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-xl border-b border-border bg-card px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold tracking-tight text-foreground text-sm">Notifications</h3>
                    {notifications.length > 0 && (
                      <span className="bg-muted text-muted-foreground text-[11px] font-medium px-1.5 py-0.5 rounded-md tabular-nums">
                        {notifications.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="-m-1 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  {loading ? (
                    <div className="animate-pulse space-y-3 p-5">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-5/6"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-10 px-6">
                      <div className="relative inline-flex items-center justify-center w-10 h-10 mb-3">
                        <span className="absolute inset-0 rounded-full bg-muted ring-1 ring-border" aria-hidden />
                        <Bell className="relative w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <p className="text-sm font-medium text-foreground">You&apos;re all caught up</p>
                      <p className="text-xs mt-1 text-muted-foreground">No events or reminders in the next 7 days</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {notifications.map((item) => (
                        <div
                          key={item.id}
                          className="px-5 py-3.5 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted ring-1 ring-border">
                              {item.type === 'reminder' ? (
                                <Bell className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
                              ) : (
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.75} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-foreground text-[13px] leading-snug">
                                  {item.title}
                                </h4>
                                {item.type === 'reminder' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleComplete(item.id);
                                    }}
                                    className="p-1 -m-1 hover:bg-muted/60 rounded-md transition-colors flex-shrink-0"
                                    title="Dismiss"
                                  >
                                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                                  </button>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                <span className="font-mono">{formatDate(item.date)}</span>
                                {isToday(item.date) && (
                                  <span className="bg-brand-50 text-brand-600 px-1.5 py-px rounded font-medium">
                                    Today
                                  </span>
                                )}
                              </div>
                              {(item.clientName || item.location) && (
                                <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                                  {item.clientName && (
                                    <span className="inline-flex items-center gap-1">
                                      <User className="w-3 h-3" />
                                      {item.clientName}
                                    </span>
                                  )}
                                  {item.location && (
                                    <span className="inline-flex items-center gap-1 truncate">
                                      <MapPin className="w-3 h-3 flex-shrink-0" />
                                      {item.location}
                                    </span>
                                  )}
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
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


// Client-side Reminder Scheduler
// Provides basic polling functionality for checking reminders
// For production, use server-side cron (Vercel Cron, etc.)

/**
 * ReminderScheduler class
 * Polls the server for pending reminders and displays notifications
 */
export class ReminderScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private checkInterval: number; // in milliseconds
  private onReminder: (reminders: any[]) => void;

  constructor(options: {
    checkInterval?: number; // Default: 5 minutes
    onReminder: (reminders: any[]) => void;
  }) {
    this.checkInterval = options.checkInterval || 5 * 60 * 1000; // 5 minutes
    this.onReminder = options.onReminder;
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.intervalId) {
      console.log('[ReminderScheduler] Already running');
      return;
    }

    console.log(`[ReminderScheduler] Starting with ${this.checkInterval / 1000}s interval`);
    
    // Check immediately on start
    this.checkReminders();
    
    // Then check periodically
    this.intervalId = setInterval(() => {
      this.checkReminders();
    }, this.checkInterval);
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[ReminderScheduler] Stopped');
    }
  }

  /**
   * Check for pending reminders
   */
  private async checkReminders() {
    try {
      const response = await fetch('/api/transactions/reminders?pending=true');
      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        console.log(`[ReminderScheduler] Found ${data.data.length} pending reminders`);
        this.onReminder(data.data);
      }
    } catch (error) {
      console.error('[ReminderScheduler] Error checking reminders:', error);
    }
  }

  /**
   * Manually trigger a check
   */
  check() {
    this.checkReminders();
  }
}

/**
 * Hook-style function for using reminder scheduler in React components
 */
export function createReminderScheduler(onReminder: (reminders: any[]) => void) {
  return new ReminderScheduler({ onReminder });
}

/**
 * Request browser notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

/**
 * Show a browser notification
 */
export function showNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }
  return null;
}

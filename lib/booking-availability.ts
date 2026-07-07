// Computes open showing/meeting slots for an agent's booking link, given
// their availability settings and a list of their existing calendar events
// (treated as "busy" blocks to avoid double-booking).

import { addCalendarDays, getZonedDateString, weekdayOf, zonedTimeToUtc } from '@/lib/timezone';

export interface BookingAvailabilitySettings {
  booking_enabled?: boolean | null;
  booking_duration_minutes?: number | null;
  booking_notice_hours?: number | null;
  booking_window_days?: number | null;
  booking_days?: number[] | null;
  booking_start_time?: string | null;
  booking_end_time?: string | null;
  booking_timezone?: string | null;
  booking_location?: string | null;
}

export interface BusyEvent {
  start_time: string;
  end_time: string;
}

export interface DaySlots {
  date: string;
  slots: string[];
}

export const BOOKING_DEFAULTS = {
  duration: 30,
  noticeHours: 4,
  windowDays: 14,
  days: [1, 2, 3, 4, 5],
  startTime: '09:00',
  endTime: '17:00',
  timezone: 'America/New_York',
};

export const MIN_DURATION = 15;
export const MAX_DURATION = 180;
export const MIN_WINDOW_DAYS = 1;
export const MAX_WINDOW_DAYS = 60;
export const MIN_NOTICE_HOURS = 0;
export const MAX_NOTICE_HOURS = 168;

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTimeString(value: unknown): value is string {
  return typeof value === 'string' && TIME_REGEX.test(value);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Compute available slots for the next `windowDays` days, grouped by
 * calendar date (in the agent's timezone).
 */
export function computeAvailableSlots(
  settings: BookingAvailabilitySettings,
  busyEvents: BusyEvent[],
  now: Date = new Date(),
): DaySlots[] {
  const timezone = settings.booking_timezone || BOOKING_DEFAULTS.timezone;
  const durationMinutes = settings.booking_duration_minutes || BOOKING_DEFAULTS.duration;
  const noticeHours = settings.booking_notice_hours ?? BOOKING_DEFAULTS.noticeHours;
  const windowDays = settings.booking_window_days || BOOKING_DEFAULTS.windowDays;
  const activeDays = new Set(
    Array.isArray(settings.booking_days) && settings.booking_days.length > 0
      ? settings.booking_days
      : BOOKING_DEFAULTS.days,
  );
  const startTime = isValidTimeString(settings.booking_start_time)
    ? settings.booking_start_time
    : BOOKING_DEFAULTS.startTime;
  const endTime = isValidTimeString(settings.booking_end_time)
    ? settings.booking_end_time
    : BOOKING_DEFAULTS.endTime;

  const earliestStart = new Date(now.getTime() + noticeHours * 60 * 60 * 1000);
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  const busyRanges = busyEvents
    .map((e) => ({ start: new Date(e.start_time).getTime(), end: new Date(e.end_time).getTime() }))
    .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end));

  const todayStr = getZonedDateString(now, timezone);
  const results: DaySlots[] = [];

  for (let dayOffset = 0; dayOffset < windowDays; dayOffset++) {
    const dateStr = addCalendarDays(todayStr, dayOffset);
    if (!activeDays.has(weekdayOf(dateStr))) continue;
    if (startMinutes >= endMinutes) continue;

    const slots: string[] = [];
    for (let minute = startMinutes; minute + durationMinutes <= endMinutes; minute += durationMinutes) {
      const hh = String(Math.floor(minute / 60)).padStart(2, '0');
      const mm = String(minute % 60).padStart(2, '0');
      const slotStart = zonedTimeToUtc(dateStr, `${hh}:${mm}`, timezone);
      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

      if (slotStart.getTime() < earliestStart.getTime()) continue;

      const isBusy = busyRanges.some((r) =>
        overlaps(slotStart.getTime(), slotEnd.getTime(), r.start, r.end),
      );
      if (isBusy) continue;

      slots.push(slotStart.toISOString());
    }

    if (slots.length > 0) {
      results.push({ date: dateStr, slots });
    }
  }

  return results;
}

/** Validates that a requested slot start time is actually still open. */
export function isSlotAvailable(
  startIso: string,
  settings: BookingAvailabilitySettings,
  busyEvents: BusyEvent[],
  now: Date = new Date(),
): boolean {
  const availability = computeAvailableSlots(settings, busyEvents, now);
  return availability.some((day) => day.slots.includes(startIso));
}

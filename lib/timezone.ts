// Lightweight IANA timezone helpers used by the booking scheduler.
//
// We intentionally avoid pulling in a date library (date-fns has no
// timezone module installed) and instead rely on the native Intl API,
// which can reliably tell us the wall-clock time in any timezone.

/** A curated list of common timezones for the availability settings dropdown. */
export const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: 'America/New_York', label: 'Eastern Time (New York)' },
  { value: 'America/Chicago', label: 'Central Time (Chicago)' },
  { value: 'America/Denver', label: 'Mountain Time (Denver)' },
  { value: 'America/Phoenix', label: 'Mountain Time — no DST (Phoenix)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (Los Angeles)' },
  { value: 'America/Anchorage', label: 'Alaska Time (Anchorage)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (Honolulu)' },
];

export const DEFAULT_TIMEZONE = 'America/New_York';

/** Returns true if `tz` looks like a timezone Intl actually recognizes. */
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Offset (in minutes) of `timeZone` from UTC at the instant `date` represents.
 * e.g. America/Los_Angeles in July -> -420 (UTC-7).
 */
function getTimezoneOffsetMinutes(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;

  const asUTC = Date.UTC(
    parseInt(map.year, 10),
    parseInt(map.month, 10) - 1,
    parseInt(map.day, 10),
    map.hour === '24' ? 0 : parseInt(map.hour, 10),
    parseInt(map.minute, 10),
    parseInt(map.second, 10),
  );

  return (asUTC - date.getTime()) / 60000;
}

/**
 * Converts a local wall-clock date + time in `timeZone` to a UTC Date.
 * dateStr: "YYYY-MM-DD", timeStr: "HH:MM"
 */
export function zonedTimeToUtc(dateStr: string, timeStr: string, timeZone: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);

  const utcGuess = new Date(Date.UTC(year, (month || 1) - 1, day || 1, hour || 0, minute || 0, 0));
  const offsetMinutes = getTimezoneOffsetMinutes(timeZone, utcGuess);

  return new Date(utcGuess.getTime() - offsetMinutes * 60000);
}

/** Returns the "YYYY-MM-DD" calendar date for `date` as seen in `timeZone`. */
export function getZonedDateString(date: Date, timeZone: string): string {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;
  return `${map.year}-${map.month}-${map.day}`;
}

/** Adds `days` calendar days to a "YYYY-MM-DD" string (pure date arithmetic, no timezone). */
export function addCalendarDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Weekday index (0 = Sunday .. 6 = Saturday) for a "YYYY-MM-DD" calendar date. */
export function weekdayOf(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Formats a "YYYY-MM-DD" string for display, e.g. "Mon, Jul 14". */
export function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** Formats a UTC ISO instant as a local time string in `timeZone`, e.g. "9:30 AM". */
export function formatTimeInZone(isoString: string, timeZone: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
  });
}

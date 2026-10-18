/**
 * Bring a user's Google Calendar into Oikaro: add new events, update changed
 * ones, and remove events deleted in Google.
 *
 * Matches on google_event_id in code rather than with a database upsert — the
 * unique index on that column is partial (WHERE google_event_id IS NOT NULL),
 * which an upsert can't target.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getGoogleCalendarEvents, refreshGoogleToken } from '@/lib/google-calendar';

/** How far back and ahead to mirror Google events. */
const MONTHS_BACK = 3;
const MONTHS_AHEAD = 6;
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

export interface GoogleCalendarConnection {
  id: string;
  access_token: string;
  refresh_token: string | null;
  token_expiry: string | null;
}

export interface CalendarSyncResult {
  added: number;
  updated: number;
  removed: number;
  /** Set when Google couldn't be read; nothing was changed in that case */
  error?: string;
}

export function syncWindow(now = new Date()): { start: Date; end: Date } {
  const start = new Date(now);
  start.setMonth(start.getMonth() - MONTHS_BACK);
  const end = new Date(now);
  end.setMonth(end.getMonth() + MONTHS_AHEAD);
  return { start, end };
}

async function refreshAndSave(supabase: SupabaseClient, connection: GoogleCalendarConnection) {
  if (!connection.refresh_token) return null;
  const refreshed = await refreshGoogleToken(connection.refresh_token);
  if (!refreshed?.success || !refreshed.access_token) return null;
  await supabase
    .from('calendar_connections')
    .update({
      access_token: refreshed.access_token,
      token_expiry: refreshed.expiry_date
        ? new Date(refreshed.expiry_date).toISOString()
        : new Date(Date.now() + 3600 * 1000).toISOString(),
    })
    .eq('id', connection.id);
  return refreshed.access_token as string;
}

/** Read Google events, refreshing the saved login when it has expired. */
async function fetchGoogleEvents(
  supabase: SupabaseClient,
  connection: GoogleCalendarConnection,
  start: Date,
  end: Date,
) {
  let accessToken = connection.access_token;
  const expiresAt = connection.token_expiry ? Date.parse(connection.token_expiry) : 0;
  if (expiresAt - Date.now() < REFRESH_BUFFER_MS) {
    accessToken = (await refreshAndSave(supabase, connection)) ?? accessToken;
  }

  let result = await getGoogleCalendarEvents(accessToken, start, end);
  if (!result.success && result.unauthorized) {
    const refreshed = await refreshAndSave(supabase, connection);
    if (refreshed) result = await getGoogleCalendarEvents(refreshed, start, end);
  }
  return result;
}

const sameTime = (a: string | null | undefined, b: string | null | undefined) =>
  Date.parse(a ?? '') === Date.parse(b ?? '');

export async function syncGoogleCalendarIntoOikaro(
  supabase: SupabaseClient,
  userId: string,
  connection: GoogleCalendarConnection,
): Promise<CalendarSyncResult> {
  const { start, end } = syncWindow();
  const result = await fetchGoogleEvents(supabase, connection, start, end);
  if (!result.success || !result.events) {
    return {
      added: 0,
      updated: 0,
      removed: 0,
      error: result.unauthorized
        ? 'Your Google Calendar connection expired. Disconnect and connect it again.'
        : 'Couldn’t read your Google Calendar. Please try again.',
    };
  }

  const { data: existingRows, error: existingError } = await supabase
    .from('calendar_events')
    .select('id, google_event_id, title, description, start_time, end_time, location')
    .eq('user_id', userId)
    .not('google_event_id', 'is', null);
  if (existingError) {
    return { added: 0, updated: 0, removed: 0, error: 'Couldn’t load your Oikaro calendar.' };
  }

  const existing = new Map((existingRows ?? []).map((row) => [row.google_event_id as string, row]));
  const seen = new Set<string>();
  const toInsert: Record<string, unknown>[] = [];
  let updated = 0;

  for (const event of result.events) {
    if (!event.start_time || !event.end_time) continue;
    seen.add(event.id);
    const fields = {
      title: event.title,
      description: event.description ?? null,
      start_time: event.start_time,
      end_time: event.end_time,
      location: event.location ?? null,
    };
    const row = existing.get(event.id);

    if (!row) {
      toInsert.push({ ...fields, user_id: userId, event_type: 'other', google_event_id: event.id });
      continue;
    }

    const changed =
      row.title !== fields.title ||
      (row.description ?? null) !== fields.description ||
      (row.location ?? null) !== fields.location ||
      !sameTime(row.start_time, fields.start_time) ||
      !sameTime(row.end_time, fields.end_time);
    if (changed) {
      // Keep the Oikaro event type (showing, open house…); only Google's details change
      const { error } = await supabase
        .from('calendar_events')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', row.id);
      if (!error) updated++;
    }
  }

  let added = 0;
  if (toInsert.length > 0) {
    const { error, count } = await supabase
      .from('calendar_events')
      .insert(toInsert, { count: 'exact' });
    if (error) {
      console.error('Calendar sync insert error:', error.message);
      return { added: 0, updated, removed: 0, error: 'Couldn’t save some Google events. Please try again.' };
    }
    added = count ?? toInsert.length;
  }

  // Events deleted in Google: linked rows in the synced window that Google no longer returns
  const removedIds = (existingRows ?? [])
    .filter((row) => {
      if (seen.has(row.google_event_id as string)) return false;
      const startsAt = Date.parse(row.start_time);
      return startsAt >= start.getTime() && startsAt <= end.getTime();
    })
    .map((row) => row.id);

  let removed = 0;
  if (removedIds.length > 0) {
    const { error } = await supabase.from('calendar_events').delete().in('id', removedIds);
    if (!error) removed = removedIds.length;
  }

  return { added, updated, removed };
}

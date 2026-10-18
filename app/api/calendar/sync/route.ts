// @ts-nocheck
// Calendar sync API route
// Sync events from connected calendars (Google/Outlook)

import { NextRequest, NextResponse } from 'next/server';
import { syncGoogleCalendarIntoOikaro } from '@/lib/calendar-sync';
import { APIResponse } from '@/types';
import { createClient } from '@/lib/supabase-server';

/**
 * POST handler - Sync events from connected calendars
 * Fetches events from Google and/or Outlook and stores them in database
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      const response: APIResponse = {
        success: false,
        error: 'Unauthorized',
      };
      return NextResponse.json(response, { status: 401 });
    }

    // Get user's active calendar connections
    const { data: connections, error: connectionsError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (connectionsError) {
      throw new Error('Failed to fetch calendar connections');
    }

    let added = 0;
    let updated = 0;
    let removed = 0;
    const errors: string[] = [];

    for (const connection of connections || []) {
      // Outlook sync isn't built yet
      if (connection.provider !== 'google') continue;
      try {
        const result = await syncGoogleCalendarIntoOikaro(supabase, user.id, connection);
        added += result.added;
        updated += result.updated;
        removed += result.removed;
        if (result.error) errors.push(result.error);
      } catch (error: any) {
        console.error('Google Calendar sync error:', error);
        errors.push('Couldn’t sync Google Calendar. Please try again.');
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors[0], data: { added, updated, removed } } satisfies APIResponse,
        { status: 502 }
      );
    }

    const changes = [
      added ? `${added} added` : '',
      updated ? `${updated} updated` : '',
      removed ? `${removed} removed` : '',
    ].filter(Boolean);
    const response: APIResponse = {
      success: true,
      message: changes.length ? `Google Calendar synced: ${changes.join(', ')}.` : 'Google Calendar is up to date.',
      data: { added, updated, removed },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Calendar sync error:', error);
    const response: APIResponse = {
      success: false,
      error: error.message || 'Failed to sync calendar events',
    };
    return NextResponse.json(response, { status: 500 });
  }
}



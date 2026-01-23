// Calendar sync API route
// Sync events from connected calendars (Google/Outlook)

import { NextRequest, NextResponse } from 'next/server';
import { getGoogleCalendarEvents, refreshGoogleToken } from '@/lib/google-calendar';
import { APIResponse } from '@/types';
import { createClient } from '@/lib/supabase-server';

/**
 * POST handler - Sync events from connected calendars
 * Fetches events from Google and/or Outlook and stores them in database
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createClient();
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

    // Define sync period (e.g., 3 months back, 6 months forward)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);

    let syncedCount = 0;
    const errors: string[] = [];

    // For each connection, fetch and sync events
    for (const connection of connections || []) {
      try {
        let accessToken = connection.access_token;
        
        // Check if token is expired and refresh if needed
        if (connection.provider === 'google' && connection.token_expiry) {
          const expiryDate = new Date(connection.token_expiry);
          const now = new Date();
          
          // Refresh if token expires in less than 5 minutes
          if (expiryDate.getTime() - now.getTime() < 5 * 60 * 1000) {
            console.log('Refreshing Google access token...');
            const refreshResult = await refreshGoogleToken(connection.refresh_token || '');
            
            if (refreshResult.success) {
              accessToken = refreshResult.access_token;
              
              // Update token in database
              await supabase
                .from('calendar_connections')
                .update({
                  access_token: accessToken,
                  token_expiry: refreshResult.expiry_date ? new Date(refreshResult.expiry_date).toISOString() : new Date().toISOString(),
                })
                .eq('id', connection.id);
            }
          }
        }

        // Fetch events from Google Calendar
        if (connection.provider === 'google') {
          const result = await getGoogleCalendarEvents(
            accessToken,
            startDate,
            endDate
          );
          
          if (result.success && result.events) {
            // Store or update events in database
            for (const event of result.events) {
              const { data, error: upsertError } = await supabase
                .from('calendar_events')
                .upsert({
                  user_id: user.id,
                  title: event.title,
                  description: event.description,
                  start_time: event.start_time,
                  end_time: event.end_time,
                  location: event.location,
                  event_type: 'other',
                  google_event_id: event.id,
                  updated_at: new Date().toISOString(),
                }, {
                  onConflict: 'google_event_id',
                  ignoreDuplicates: false, // Update existing events
                })
                .select();

              if (upsertError) {
                console.error(`❌ Sync error for "${event.title}":`, upsertError.message);
                errors.push(`Event "${event.title}": ${upsertError.message}`);
              } else {
                syncedCount++;
              }
            }
          }
        }
        // Add Outlook support here later if needed
      } catch (error: any) {
        console.error(`Sync error for ${connection.provider}:`, error);
        errors.push(`${connection.provider}: ${error.message}`);
      }
    }

    const response: APIResponse = {
      success: true,
      message: `Successfully synced ${syncedCount} events`,
      data: {
        synced: syncedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
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



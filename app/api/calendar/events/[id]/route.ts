// Calendar event delete API route
// DELETE /api/calendar/events/[id]

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { APIResponse } from '@/types';

/**
 * DELETE handler - Delete a calendar event
 * Also deletes from Google Calendar if synced
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const eventId = params.id;

    // Get event details first
    const { data: event, error: fetchError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('id', eventId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !event) {
      const response: APIResponse = {
        success: false,
        error: 'Event not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    console.log('🗑️ Deleting calendar event:', event.title);

    // Delete from Google Calendar if it has a google_event_id
    if (event.google_event_id) {
      try {
        const { data: connections } = await supabase
          .from('calendar_connections')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (connections && connections.length > 0) {
          const { deleteGoogleCalendarEvent, refreshGoogleToken } = await import('@/lib/google-calendar');

          for (const connection of connections) {
            if (connection.provider === 'google') {
              let accessToken = connection.access_token;

              // Refresh token if needed
              if (connection.token_expiry) {
                const expiryDate = new Date(connection.token_expiry);
                const now = new Date();

                if (expiryDate.getTime() - now.getTime() < 5 * 60 * 1000) {
                  const refreshResult = await refreshGoogleToken(connection.refresh_token || '');

                  if (refreshResult.success) {
                    accessToken = refreshResult.access_token;

                    await supabase
                      .from('calendar_connections')
                      .update({
                        access_token: accessToken,
                        token_expiry: new Date(refreshResult.expiry_date).toISOString(),
                      })
                      .eq('id', connection.id);
                  }
                }
              }

              // Delete from Google Calendar
              const deleteResult = await deleteGoogleCalendarEvent(accessToken, event.google_event_id);

              if (deleteResult.success) {
                console.log('✅ Deleted from Google Calendar:', event.google_event_id);
              } else {
                console.error('⚠️ Failed to delete from Google Calendar:', deleteResult.error);
              }
            }
          }
        }
      } catch (googleError: any) {
        console.error('⚠️ Google Calendar delete error (continuing):', googleError.message);
        // Don't fail the whole request if Google delete fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    console.log('✅ Calendar event deleted from database');

    const response: APIResponse = {
      success: true,
      message: 'Event deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Delete calendar event error:', error);
    const response: APIResponse = {
      success: false,
      error: error.message || 'Failed to delete calendar event',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

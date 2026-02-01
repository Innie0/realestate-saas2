// Calendar events API route
// Handle calendar event CRUD operations

import { NextRequest, NextResponse } from 'next/server';
import { CalendarEvent, APIResponse } from '@/types';
import { createClient } from '@/lib/supabase-server';

/**
 * GET handler - Retrieve calendar events
 * Query params: month, year (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const year = searchParams.get('year');

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

    // Build query
    let query = supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: true });

    // Filter by month/year if provided
    if (month !== null && year !== null) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      const startDate = new Date(yearNum, monthNum, 1).toISOString();
      const endDate = new Date(yearNum, monthNum + 1, 0, 23, 59, 59).toISOString();
      
      query = query
        .gte('start_time', startDate)
        .lte('start_time', endDate);
    }

    const { data: events, error } = await query;

    if (error) {
      throw error;
    }

    const response: APIResponse<CalendarEvent[]> = {
      success: true,
      data: events || [],
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Get calendar events error:', error);
    const response: APIResponse = {
      success: false,
      error: error.message || 'Failed to retrieve calendar events',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * POST handler - Create a new calendar event
 * Body: title, description, start_time, end_time, location, event_type, project_id, attendees
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

    // Parse request body
    const body = await request.json();
    const {
      title,
      description,
      start_time,
      end_time,
      location,
      event_type,
      project_id,
      attendees,
    } = body;

    // Validate required fields
    if (!title || !start_time || !end_time) {
      const response: APIResponse = {
        success: false,
        error: 'Title, start time, and end time are required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Create event in database
    const { data: newEvent, error: insertError } = await supabase
      .from('calendar_events')
      .insert({
        user_id: user.id,
        title,
        description,
        start_time,
        end_time,
        location,
        event_type: event_type || 'other',
        project_id,
        attendees,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log('✅ Event created in database:', newEvent.title);

    // Sync to connected calendars (Google Calendar)
    try {
      const { data: connections } = await supabase
        .from('calendar_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (connections && connections.length > 0) {
        const { createGoogleCalendarEvent, refreshGoogleToken } = await import('@/lib/google-calendar');
        
        for (const connection of connections) {
          if (connection.provider === 'google') {
            // Check if token needs refresh
            let accessToken = connection.access_token;
            
            if (connection.token_expiry) {
              const expiryDate = new Date(connection.token_expiry);
              const now = new Date();
              
              // Refresh if token expires in less than 5 minutes
              if (expiryDate.getTime() - now.getTime() < 5 * 60 * 1000) {
                console.log('🔄 Refreshing Google access token...');
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
            
            // Push event to Google Calendar
            const googleResult = await createGoogleCalendarEvent(accessToken, {
              title,
              description,
              start_time,
              end_time,
              location,
              attendees,
            });
            
            if (googleResult.success) {
              // Update event with Google Calendar ID
              await supabase
                .from('calendar_events')
                .update({ google_event_id: googleResult.event_id })
                .eq('id', newEvent.id);
              
              console.log('✅ Event pushed to Google Calendar:', googleResult.event_id);
            } else {
              console.error('❌ Failed to push to Google Calendar:', googleResult.error);
            }
          }
        }
      }
    } catch (syncError: any) {
      console.error('⚠️ Failed to sync to external calendars:', syncError.message);
      // Don't fail the whole request if external sync fails
    }

    const response: APIResponse<CalendarEvent> = {
      success: true,
      message: 'Calendar event created successfully',
      data: newEvent,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Create calendar event error:', error);
    const response: APIResponse = {
      success: false,
      error: error.message || 'Failed to create calendar event',
    };
    return NextResponse.json(response, { status: 500 });
  }
}



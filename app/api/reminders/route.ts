// API route for reminders - GET (list all upcoming) and POST (create)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/reminders
 * Fetch all upcoming reminders for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const includeCompleted = searchParams.get('include_completed') === 'true';
    const clientId = searchParams.get('client_id');

    // Build query
    let query = supabase
      .from('reminders')
      .select(`
        *,
        clients:client_id (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('user_id', user.id)
      .order('reminder_date', { ascending: true });

    // Filter by client if specified
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    // Filter by completion status
    if (!includeCompleted) {
      query = query.eq('is_completed', false);
    }

    const { data: reminders, error } = await query;

    if (error) {
      console.error('Error fetching reminders:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch reminders' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    console.error('Error in GET /api/reminders:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reminders
 * Create a new reminder
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { client_id, title, description, reminder_date } = body;

    // Validate required fields
    if (!client_id || !title || !reminder_date) {
      return NextResponse.json(
        { success: false, error: 'Client ID, title, and reminder date are required' },
        { status: 400 }
      );
    }

    // Verify client belongs to user
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Create reminder
    const { data: reminder, error } = await supabase
      .from('reminders')
      .insert({
        client_id,
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        reminder_date,
        is_completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reminder:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create reminder' },
        { status: 500 }
      );
    }

    console.log('✅ Reminder created:', reminder.title);

    // Get client details for calendar event
    const { data: clientDetails } = await supabase
      .from('clients')
      .select('name, email, phone')
      .eq('id', client_id)
      .single();

    // Create calendar event for this reminder
    try {
      const reminderDateTime = new Date(reminder_date);
      const endTime = new Date(reminderDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

      const { data: calendarEvent, error: calendarError } = await supabase
        .from('calendar_events')
        .insert({
          user_id: user.id,
          title: `📋 ${title.trim()}`,
          description: `Client: ${clientDetails?.name || 'Unknown'}\n${description?.trim() || ''}`,
          start_time: reminderDateTime.toISOString(),
          end_time: endTime.toISOString(),
          location: clientDetails?.phone ? `📞 ${clientDetails.phone}` : undefined,
          event_type: 'meeting',
          attendees: clientDetails?.email ? [clientDetails.email] : [],
        })
        .select()
        .single();

      if (calendarError) {
        console.error('⚠️ Failed to create calendar event for reminder:', calendarError);
      } else {
        console.log('✅ Calendar event created for reminder');

        // Push to Google Calendar if connected
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

                if (expiryDate.getTime() - now.getTime() < 5 * 60 * 1000) {
                  const refreshResult = await refreshGoogleToken(connection.refresh_token || '');

                  if (refreshResult.success) {
                    accessToken = refreshResult.access_token;

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

              // Push to Google Calendar
              const googleResult = await createGoogleCalendarEvent(accessToken, {
                title: calendarEvent.title,
                description: calendarEvent.description || undefined,
                start_time: calendarEvent.start_time,
                end_time: calendarEvent.end_time,
                location: calendarEvent.location || undefined,
                attendees: calendarEvent.attendees || [],
              });

              console.log('📤 Google Calendar push result:', googleResult);

              if (googleResult.success) {
                await supabase
                  .from('calendar_events')
                  .update({ google_event_id: googleResult.event_id })
                  .eq('id', calendarEvent.id);

                console.log('✅ Reminder pushed to Google Calendar with ID:', googleResult.event_id);
              } else {
                console.error('❌ Failed to push reminder to Google Calendar:', googleResult.error);
              }
            }
          }
        }
      }
    } catch (calendarSyncError: any) {
      console.error('⚠️ Calendar sync error (reminder still created):', calendarSyncError.message);
      // Don't fail the request if calendar sync fails
    }

    return NextResponse.json({
      success: true,
      data: reminder,
      message: 'Reminder created successfully and added to calendar',
      calendarEvent: {
        date: new Date(reminder_date).toLocaleDateString(),
        month: new Date(reminder_date).toLocaleString('default', { month: 'long', year: 'numeric' }),
      },
    });
  } catch (error) {
    console.error('Error in POST /api/reminders:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


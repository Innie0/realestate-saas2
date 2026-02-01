// API route for individual reminder - PUT (update) and DELETE
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * PUT /api/reminders/[id]
 * Update a reminder (including marking as completed)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const reminderId = params.id;

    // Parse request body
    const body = await request.json();
    const { title, description, reminder_date, is_completed } = body;

    // Build update object
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (reminder_date !== undefined) updateData.reminder_date = reminder_date;
    if (is_completed !== undefined) {
      updateData.is_completed = is_completed;
      if (is_completed) {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }
    }

    // Update reminder
    const { data: reminder, error } = await supabase
      .from('reminders')
      .update(updateData)
      .eq('id', reminderId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !reminder) {
      console.error('Error updating reminder:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update reminder' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reminder,
      message: 'Reminder updated successfully',
    });
  } catch (error) {
    console.error('Error in PUT /api/reminders/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reminders/[id]
 * Delete a reminder and its associated calendar event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const reminderId = params.id;

    // Get reminder details first (to find associated calendar events)
    const { data: reminder } = await supabase
      .from('reminders')
      .select('id, title, reminder_date')
      .eq('id', reminderId)
      .eq('user_id', user.id)
      .single();

    if (!reminder) {
      return NextResponse.json(
        { success: false, error: 'Reminder not found' },
        { status: 404 }
      );
    }

    // Find and delete associated calendar event(s)
    // Match by title pattern and date
    const reminderDate = new Date(reminder.reminder_date);
    const startOfDay = new Date(reminderDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reminderDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: calendarEvents } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', user.id)
      .like('title', `%${reminder.title}%`)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString());

    // Delete from Google Calendar first
    if (calendarEvents && calendarEvents.length > 0) {
      const { data: connections } = await supabase
        .from('calendar_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (connections && connections.length > 0) {
        const { deleteGoogleCalendarEvent, refreshGoogleToken } = await import('@/lib/google-calendar');

        for (const event of calendarEvents) {
          if (event.google_event_id) {
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
                          token_expiry: refreshResult.expiry_date ? new Date(refreshResult.expiry_date).toISOString() : new Date().toISOString(),
                        })
                        .eq('id', connection.id);
                    }
                  }
                }

                // Delete from Google Calendar
                const deleteResult = await deleteGoogleCalendarEvent(accessToken, event.google_event_id);

                if (deleteResult.success) {
                  console.log('✅ Deleted event from Google Calendar:', event.google_event_id);
                } else {
                  console.error('⚠️ Failed to delete from Google Calendar:', deleteResult.error);
                }
              }
            }
          }
        }
      }

      // Delete calendar events from database
      await supabase
        .from('calendar_events')
        .delete()
        .in('id', calendarEvents.map(e => e.id));

      console.log(`✅ Deleted ${calendarEvents.length} calendar event(s) associated with reminder`);
    }

    // Delete reminder
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', reminderId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting reminder:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete reminder' },
        { status: 500 }
      );
    }

    console.log('✅ Reminder deleted:', reminder.title);

    return NextResponse.json({
      success: true,
      message: 'Reminder and associated calendar events deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/reminders/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


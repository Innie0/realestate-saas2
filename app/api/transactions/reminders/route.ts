// Transaction Reminders API route
// Handles reminder operations and the cron-like scheduler endpoint

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/transactions/reminders
 * Fetches upcoming reminders for the current user
 * Also used by the cron scheduler to get pending reminders
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const upcoming = searchParams.get('upcoming') === 'true';
    const pending = searchParams.get('pending') === 'true';

    // Build query
    let query = supabase
      .from('transaction_reminders')
      .select(`
        *,
        transaction:transactions(
          id, property_address, buyer_name, seller_name, status
        )
      `)
      .eq('user_id', user.id)
      .eq('is_dismissed', false)
      .order('reminder_date', { ascending: true });

    // Filter for upcoming reminders (not yet sent, date is in the future or today)
    if (upcoming) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query = query
        .eq('is_sent', false)
        .gte('reminder_date', today.toISOString());
    }

    // Filter for pending reminders (should be sent now - for cron)
    if (pending) {
      const now = new Date();
      query = query
        .eq('is_sent', false)
        .lte('reminder_date', now.toISOString());
    }

    const { data: reminders, error } = await query;

    if (error) {
      console.error('Error fetching reminders:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reminders,
    });
  } catch (error) {
    console.error('Reminders GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions/reminders
 * Creates a custom reminder
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.transaction_id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    if (!body.title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!body.reminder_date) {
      return NextResponse.json(
        { success: false, error: 'Reminder date is required' },
        { status: 400 }
      );
    }

    // Verify transaction ownership
    const { data: transaction, error: checkError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', body.transaction_id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Create reminder
    const { data: reminder, error } = await supabase
      .from('transaction_reminders')
      .insert({
        transaction_id: body.transaction_id,
        user_id: user.id,
        title: body.title,
        description: body.description || null,
        reminder_date: body.reminder_date,
        reminder_type: 'custom',
        days_before: body.days_before || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating reminder:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reminder,
      message: 'Reminder created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Reminders POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/transactions/reminders
 * Updates a reminder (mark as sent, dismiss, etc.)
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.reminder_id) {
      return NextResponse.json(
        { success: false, error: 'Reminder ID is required' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, any> = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.reminder_date !== undefined) updateData.reminder_date = body.reminder_date;
    
    // Handle dismissal
    if (body.is_dismissed !== undefined) {
      updateData.is_dismissed = body.is_dismissed;
    }
    
    // Handle marking as sent
    if (body.is_sent !== undefined) {
      updateData.is_sent = body.is_sent;
      updateData.sent_at = body.is_sent ? new Date().toISOString() : null;
    }

    // Update reminder
    const { data: reminder, error } = await supabase
      .from('transaction_reminders')
      .update(updateData)
      .eq('id', body.reminder_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating reminder:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reminder,
      message: 'Reminder updated successfully',
    });
  } catch (error) {
    console.error('Reminders PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/transactions/reminders
 * Deletes a reminder
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reminderId = searchParams.get('reminder_id');

    if (!reminderId) {
      return NextResponse.json(
        { success: false, error: 'Reminder ID is required' },
        { status: 400 }
      );
    }

    // Delete reminder
    const { error } = await supabase
      .from('transaction_reminders')
      .delete()
      .eq('id', reminderId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting reminder:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder deleted successfully',
    });
  } catch (error) {
    console.error('Reminders DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

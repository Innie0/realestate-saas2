// Individual Transaction API route
// Handles GET (single), PUT (update), and DELETE operations

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { updateTransactionCalendarEvents, deleteTransactionCalendarEvents } from '@/lib/transaction-calendar-sync';

/**
 * GET /api/transactions/[id]
 * Fetches a single transaction with all related data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Fetch transaction with related data
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select(`
        *,
        checklist_items:transaction_checklist_items(
          id, title, description, category, due_date, 
          is_completed, completed_at, order_index, created_at
        ),
        reminders:transaction_reminders(
          id, title, description, reminder_date, reminder_type,
          days_before, is_sent, sent_at, is_dismissed, created_at
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Transaction not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching transaction:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Sort checklist items by order_index
    if (transaction.checklist_items) {
      transaction.checklist_items.sort((a: any, b: any) => a.order_index - b.order_index);
    }

    // Sort reminders by reminder_date
    if (transaction.reminders) {
      transaction.reminders.sort((a: any, b: any) => 
        new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime()
      );
    }

    // Calculate additional fields
    const checklistItems = transaction.checklist_items || [];
    const completedItems = checklistItems.filter((item: any) => item.is_completed).length;
    
    let daysToClosing = null;
    if (transaction.closing_date) {
      const today = new Date();
      const closingDate = new Date(transaction.closing_date);
      daysToClosing = Math.ceil((closingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    return NextResponse.json({
      success: true,
      data: {
        ...transaction,
        completed_items_count: completedItems,
        total_items_count: checklistItems.length,
        days_to_closing: daysToClosing,
      },
    });
  } catch (error) {
    console.error('Transaction GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/transactions/[id]
 * Updates a transaction
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const body = await request.json();

    // Verify ownership
    const { data: existing, error: checkError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Build update object (only include provided fields)
    const updateData: Record<string, any> = {};
    const allowedFields = [
      'property_address', 'property_city', 'property_state', 'property_zip', 'property_type',
      'buyer_name', 'buyer_email', 'buyer_phone', 'buyer_agent_name', 'buyer_agent_email', 'buyer_agent_phone',
      'seller_name', 'seller_email', 'seller_phone', 'seller_agent_name', 'seller_agent_email', 'seller_agent_phone',
      'offer_price', 'earnest_money', 'down_payment', 'loan_amount',
      'terms', 'notes',
      'offer_date', 'acceptance_date', 'inspection_date', 'inspection_deadline',
      'appraisal_date', 'appraisal_deadline', 'financing_deadline', 'title_deadline',
      'closing_date', 'possession_date',
      'status', 'project_id', 'client_id'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Check if any date fields are being updated
    const dateFields = [
      'offer_date', 'acceptance_date', 'inspection_date', 'inspection_deadline',
      'appraisal_date', 'appraisal_deadline', 'financing_deadline', 'title_deadline',
      'closing_date', 'possession_date'
    ];
    const datesChanged = dateFields.some(field => body[field] !== undefined);

    // Update transaction
    const { data: transaction, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // If dates changed, update calendar events
    if (datesChanged) {
      try {
        const syncResult = await updateTransactionCalendarEvents(supabase, user.id, transaction);
        if (syncResult.success) {
          console.log(`✅ Updated ${syncResult.eventsUpdated} calendar events for transaction`);
        }
      } catch (syncError) {
        console.error('⚠️ Calendar sync error (non-fatal):', syncError);
      }
    }

    return NextResponse.json({
      success: true,
      data: transaction,
      message: 'Transaction updated successfully',
    });
  } catch (error) {
    console.error('Transaction PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/transactions/[id]
 * Deletes a transaction
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Delete calendar events first (before transaction is deleted)
    try {
      const deleteResult = await deleteTransactionCalendarEvents(supabase, user.id, id);
      if (deleteResult.success && deleteResult.eventsDeleted > 0) {
        console.log(`✅ Deleted ${deleteResult.eventsDeleted} calendar events for transaction`);
      }
    } catch (calendarError) {
      console.error('⚠️ Error deleting calendar events (non-fatal):', calendarError);
    }

    // Delete transaction (checklist items and reminders are cascade deleted)
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting transaction:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    console.error('Transaction DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

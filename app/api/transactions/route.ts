// Transactions API route
// Handles GET (list all) and POST (create new) operations

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { Transaction } from '@/types';
import { syncTransactionToCalendar } from '@/lib/transaction-calendar-sync';

/**
 * GET /api/transactions
 * Fetches all transactions for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query = supabase
      .from('transactions')
      .select(`
        *,
        checklist_items:transaction_checklist_items(id, is_completed),
        reminders:transaction_reminders(id, is_sent, is_dismissed, reminder_date)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Calculate additional fields for each transaction
    const transactionsWithDetails = transactions?.map(transaction => {
      const checklistItems = transaction.checklist_items || [];
      const completedItems = checklistItems.filter((item: any) => item.is_completed).length;
      
      // Calculate days to closing
      let daysToClosing = null;
      if (transaction.closing_date) {
        const today = new Date();
        const closingDate = new Date(transaction.closing_date);
        daysToClosing = Math.ceil((closingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        ...transaction,
        completed_items_count: completedItems,
        total_items_count: checklistItems.length,
        days_to_closing: daysToClosing,
      };
    });

    return NextResponse.json({
      success: true,
      data: transactionsWithDetails,
    });
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions
 * Creates a new transaction
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.property_address) {
      return NextResponse.json(
        { success: false, error: 'Property address is required' },
        { status: 400 }
      );
    }

    if (!body.buyer_name) {
      return NextResponse.json(
        { success: false, error: 'Buyer name is required' },
        { status: 400 }
      );
    }

    if (!body.seller_name) {
      return NextResponse.json(
        { success: false, error: 'Seller name is required' },
        { status: 400 }
      );
    }

    if (!body.offer_price || body.offer_price <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid offer price is required' },
        { status: 400 }
      );
    }

    // Create transaction data
    const transactionData = {
      user_id: user.id,
      property_address: body.property_address,
      property_city: body.property_city || null,
      property_state: body.property_state || null,
      property_zip: body.property_zip || null,
      property_type: body.property_type || null,
      buyer_name: body.buyer_name,
      buyer_email: body.buyer_email || null,
      buyer_phone: body.buyer_phone || null,
      buyer_agent_name: body.buyer_agent_name || null,
      buyer_agent_email: body.buyer_agent_email || null,
      buyer_agent_phone: body.buyer_agent_phone || null,
      seller_name: body.seller_name,
      seller_email: body.seller_email || null,
      seller_phone: body.seller_phone || null,
      seller_agent_name: body.seller_agent_name || null,
      seller_agent_email: body.seller_agent_email || null,
      seller_agent_phone: body.seller_agent_phone || null,
      offer_price: body.offer_price,
      earnest_money: body.earnest_money || null,
      down_payment: body.down_payment || null,
      loan_amount: body.loan_amount || null,
      terms: body.terms || {},
      notes: body.notes || null,
      offer_date: body.offer_date || null,
      acceptance_date: body.acceptance_date || null,
      inspection_date: body.inspection_date || null,
      inspection_deadline: body.inspection_deadline || null,
      appraisal_date: body.appraisal_date || null,
      appraisal_deadline: body.appraisal_deadline || null,
      financing_deadline: body.financing_deadline || null,
      title_deadline: body.title_deadline || null,
      closing_date: body.closing_date || null,
      possession_date: body.possession_date || null,
      status: body.status || 'active',
      project_id: body.project_id || null,
      client_id: body.client_id || null,
    };

    // Insert transaction (checklist and reminders are auto-generated by triggers)
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Sync important dates to calendar (web app + Google Calendar)
    try {
      // Log what we're sending to sync
      console.log('📅 Transaction created, preparing calendar sync...');
      console.log('📅 Transaction dates from DB:', {
        closing_date: transaction.closing_date,
        inspection_date: transaction.inspection_date,
        offer_date: transaction.offer_date,
        all_dates: [
          transaction.offer_date,
          transaction.acceptance_date,
          transaction.inspection_date,
          transaction.inspection_deadline,
          transaction.appraisal_date,
          transaction.appraisal_deadline,
          transaction.financing_deadline,
          transaction.title_deadline,
          transaction.closing_date,
          transaction.possession_date,
        ].filter(Boolean)
      });
      
      const syncResult = await syncTransactionToCalendar(supabase, user.id, transaction);
      
      if (syncResult.success && syncResult.eventsCreated > 0) {
        console.log(`✅ Synced ${syncResult.eventsCreated} calendar events for transaction`);
      } else if (syncResult.error) {
        console.error('⚠️ Calendar sync warning:', syncResult.error);
      } else {
        console.log('ℹ️ Calendar sync completed but no events created (no dates provided?)');
      }
    } catch (syncError) {
      // Don't fail the transaction creation if calendar sync fails
      console.error('⚠️ Calendar sync error (non-fatal):', syncError);
    }

    return NextResponse.json({
      success: true,
      data: transaction,
      message: 'Transaction created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Transactions POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

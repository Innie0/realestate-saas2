// @ts-nocheck
// API route for individual client - GET, PUT (update), DELETE
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { mergeClientTransactions } from '@/lib/transaction-client-link';
import { buildClientLeadOrigin, isLeadOriginSource } from '@/lib/client-lead-origin';

/**
 * GET /api/clients/[id]
 * Fetch a single client with their notes and reminders
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const clientId = id;

    // Fetch client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Fetch notes
    const { data: notes } = await supabase
      .from('client_notes')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    // Fetch reminders
    const { data: reminders } = await supabase
      .from('reminders')
      .select('*')
      .eq('client_id', clientId)
      .order('reminder_date', { ascending: true });

    // Count upcoming reminders
    const upcomingReminders = reminders?.filter(
      r => !r.is_completed && new Date(r.reminder_date) >= new Date()
    ).length || 0;

    const transactionSelect =
      'id, status, property_address, offer_price, closing_date, created_at';

    const [
      { data: buyerTransactions },
      { data: sellerTransactions },
      { data: legacyTransactions },
    ] = await Promise.all([
      supabase
        .from('transactions')
        .select(transactionSelect)
        .eq('user_id', user.id)
        .eq('buyer_client_id', clientId)
        .order('created_at', { ascending: false }),
      supabase
        .from('transactions')
        .select(transactionSelect)
        .eq('user_id', user.id)
        .eq('seller_client_id', clientId)
        .order('created_at', { ascending: false }),
      supabase
        .from('transactions')
        .select(transactionSelect)
        .eq('user_id', user.id)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false }),
    ]);

    const transactions = mergeClientTransactions(
      buyerTransactions ?? [],
      sellerTransactions ?? [],
      legacyTransactions ?? [],
    );

    let leadOrigin = null;
    if (isLeadOriginSource(client.source)) {
      let project = null;
      if (client.project_id) {
        const { data: projectRow } = await supabase
          .from('projects')
          .select('id, title, property_info')
          .eq('id', client.project_id)
          .eq('user_id', user.id)
          .maybeSingle();
        project = projectRow;
      }

      leadOrigin = buildClientLeadOrigin(client, project);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...client,
        notes: notes || [],
        reminders: reminders || [],
        upcoming_reminders_count: upcomingReminders,
        transactions,
        lead_origin: leadOrigin,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/clients/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/clients/[id]
 * Update a client
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const clientId = id;

    // Parse request body
    const body = await request.json();
    const { name, email, phone, status } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Update client
    const { data: client, error } = await supabase
      .from('clients')
      .update({
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        status: status || 'active',
      })
      .eq('id', clientId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !client) {
      console.error('Error updating client:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update client' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: client,
      message: 'Client updated successfully',
    });
  } catch (error) {
    console.error('Error in PUT /api/clients/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/[id]
 * Delete a client (and cascade delete notes and reminders)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const clientId = id;

    // Delete client (notes and reminders will cascade delete)
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting client:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete client' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/clients/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


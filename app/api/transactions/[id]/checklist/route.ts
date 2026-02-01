// Transaction Checklist API route
// Handles checklist item operations

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * POST /api/transactions/[id]/checklist
 * Adds a new checklist item to a transaction
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: transactionId } = await params;
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const body = await request.json();

    // Verify transaction ownership
    const { data: transaction, error: checkError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', transactionId)
      .eq('user_id', user.id)
      .single();

    if (checkError || !transaction) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Get max order_index for this transaction
    const { data: maxOrder } = await supabase
      .from('transaction_checklist_items')
      .select('order_index')
      .eq('transaction_id', transactionId)
      .order('order_index', { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (maxOrder?.order_index || 0) + 1;

    // Create checklist item
    const { data: item, error } = await supabase
      .from('transaction_checklist_items')
      .insert({
        transaction_id: transactionId,
        user_id: user.id,
        title: body.title,
        description: body.description || null,
        category: body.category || 'other',
        due_date: body.due_date || null,
        order_index: nextOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating checklist item:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Checklist item added successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Checklist POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/transactions/[id]/checklist
 * Updates a checklist item (toggle completion, edit, etc.)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.item_id) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, any> = {};
    
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.due_date !== undefined) updateData.due_date = body.due_date;
    if (body.order_index !== undefined) updateData.order_index = body.order_index;
    
    // Handle completion toggle
    if (body.is_completed !== undefined) {
      updateData.is_completed = body.is_completed;
      updateData.completed_at = body.is_completed ? new Date().toISOString() : null;
    }

    // Update checklist item
    const { data: item, error } = await supabase
      .from('transaction_checklist_items')
      .update(updateData)
      .eq('id', body.item_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating checklist item:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
      message: 'Checklist item updated successfully',
    });
  } catch (error) {
    console.error('Checklist PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/transactions/[id]/checklist
 * Deletes a checklist item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('item_id');

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Delete checklist item
    const { error } = await supabase
      .from('transaction_checklist_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting checklist item:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Checklist item deleted successfully',
    });
  } catch (error) {
    console.error('Checklist DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// @ts-nocheck
// Single Contract API Route
// Handles getting, updating, and deleting individual contracts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/contracts/[id]
 * Get a single contract by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch contract with related data
    const { data: contract, error } = await supabase
      .from('contracts')
      .select(`
        *,
        transaction:transactions(id, property_address, status, closing_date),
        client:clients(id, name, email, phone)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ contract });
  } catch (error: any) {
    console.error('[Contract API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/contracts/[id]
 * Update a contract
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      title,
      contract_type,
      status,
      property_address,
      transaction_id,
      client_id,
      contract_date,
      expiration_date,
      signed_date,
      notes,
      tags,
    } = body;

    // Update contract
    const { data: contract, error } = await supabase
      .from('contracts')
      .update({
        title,
        contract_type,
        status,
        property_address,
        transaction_id,
        client_id,
        contract_date,
        expiration_date,
        signed_date,
        notes,
        tags,
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('[Contract API] Error updating contract:', error);
      return NextResponse.json(
        { error: 'Failed to update contract' },
        { status: 500 }
      );
    }

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    console.log('[Contract API] Contract updated:', contract.id);

    return NextResponse.json({ contract });
  } catch (error: any) {
    console.error('[Contract API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contracts/[id]
 * Delete a contract and its file
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get contract to find file path
    const { data: contract } = await supabase
      .from('contracts')
      .select('file_path')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Delete file from storage
    if (contract.file_path) {
      const { error: storageError } = await supabase.storage
        .from('contracts')
        .remove([contract.file_path]);

      if (storageError) {
        console.error('[Contract API] Error deleting file:', storageError);
      }
    }

    // Delete contract record
    const { error } = await supabase
      .from('contracts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('[Contract API] Error deleting contract:', error);
      return NextResponse.json(
        { error: 'Failed to delete contract' },
        { status: 500 }
      );
    }

    console.log('[Contract API] Contract deleted:', id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Contract API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

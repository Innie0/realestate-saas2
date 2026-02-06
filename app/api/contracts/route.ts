// @ts-nocheck
// Contracts API Route
// Handles listing all contracts and creating new contracts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/contracts
 * List all contracts for the current user with optional filtering
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const transaction_id = searchParams.get('transaction_id');
    const client_id = searchParams.get('client_id');
    const contract_type = searchParams.get('contract_type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('contracts')
      .select(`
        *,
        transaction:transactions(id, property_address, status),
        client:clients(id, name, email)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (transaction_id) {
      query = query.eq('transaction_id', transaction_id);
    }
    if (client_id) {
      query = query.eq('client_id', client_id);
    }
    if (contract_type) {
      query = query.eq('contract_type', contract_type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    const { data: contracts, error } = await query;

    if (error) {
      console.error('[Contracts API] Error fetching contracts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contracts' },
        { status: 500 }
      );
    }

    return NextResponse.json({ contracts });
  } catch (error: any) {
    console.error('[Contracts API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contracts
 * Create a new contract record
 */
export async function POST(req: NextRequest) {
  try {
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
      file_name,
      file_path,
      file_size,
      file_type,
      contract_type,
      status = 'draft',
      property_address,
      transaction_id,
      client_id,
      contract_date,
      expiration_date,
      signed_date,
      notes,
      tags,
    } = body;

    // Validate required fields
    if (!title || !file_name || !file_path) {
      return NextResponse.json(
        { error: 'Missing required fields: title, file_name, file_path' },
        { status: 400 }
      );
    }

    // Create contract
    const { data: contract, error } = await supabase
      .from('contracts')
      .insert({
        user_id: user.id,
        title,
        file_name,
        file_path,
        file_size,
        file_type,
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
      .select()
      .single();

    if (error) {
      console.error('[Contracts API] Error creating contract:', error);
      return NextResponse.json(
        { error: 'Failed to create contract' },
        { status: 500 }
      );
    }

    console.log('[Contracts API] Contract created:', contract.id);

    return NextResponse.json({ contract }, { status: 201 });
  } catch (error: any) {
    console.error('[Contracts API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

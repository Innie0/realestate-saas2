// API route for client notes - GET (list) and POST (create)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/clients/[id]/notes
 * Fetch all notes for a specific client
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

    // Verify client belongs to user
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Fetch notes
    const { data: notes, error } = await supabase
      .from('client_notes')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    console.error('Error in GET /api/clients/[id]/notes:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients/[id]/notes
 * Create a new note for a client
 */
export async function POST(
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

    // Verify client belongs to user
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { note } = body;

    // Validate required fields
    if (!note || note.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Note content is required' },
        { status: 400 }
      );
    }

    // Create note
    const { data: newNote, error } = await supabase
      .from('client_notes')
      .insert({
        client_id: clientId,
        user_id: user.id,
        note: note.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create note' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newNote,
      message: 'Note created successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/clients/[id]/notes:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


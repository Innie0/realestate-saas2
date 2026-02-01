// API route for clients - GET (list) and POST (create)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/clients
 * Fetch all clients for the authenticated user with optional search
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

    // Get search query parameter
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'active';

    // Build query - include latest note and reminders count
    let query = supabase
      .from('clients')
      .select(`
        *,
        client_notes(id, note, created_at),
        reminders(id, is_completed, reminder_date)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: clients, error } = await query;

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch clients' },
        { status: 500 }
      );
    }

    // Process clients to add computed fields
    const processedClients = clients?.map(client => {
      const notes = client.client_notes || [];
      const reminders = client.reminders || [];
      
      // Sort notes by creation date (newest first)
      const sortedNotes = notes.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // Get the most recent note
      const latestNote = sortedNotes.length > 0 ? sortedNotes[0] : null;

      // Count upcoming incomplete reminders
      const upcomingReminders = reminders.filter((r: any) => 
        !r.is_completed && new Date(r.reminder_date) >= new Date()
      ).length;

      return {
        ...client,
        latest_note: latestNote,
        all_notes: sortedNotes, // Include all notes for carousel
        notes_count: notes.length,
        upcoming_reminders_count: upcomingReminders,
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: processedClients,
    });
  } catch (error) {
    console.error('Error in GET /api/clients:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients
 * Create a new client
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
    const { name, email, phone } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Create client
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create client' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: client,
      message: 'Client created successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/clients:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


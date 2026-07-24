// @ts-nocheck
// API route for clients - GET (list) and POST (create)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { checkUsageLimit, incrementUsage, usageLimitError } from '@/lib/usage';
import { fetchLeadSequenceSummaries } from '@/lib/lead-sequences/summary';

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
    const source = searchParams.get('source');
    const view = searchParams.get('view'); // 'crm' (default) | 'inbox'

    // Build query - include latest note and reminders count
    let query = supabase
      .from('clients')
      .select(`
        *,
        projects:project_id (
          id,
          title,
          property_info,
          published
        ),
        client_notes(id, note, created_at),
        reminders(id, title, is_completed, reminder_date)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // CRM list: only promoted clients + manually added
    // Inbox: captured leads not yet in CRM
    if (view === 'inbox') {
      query = query.eq('in_crm', false).in('source', ['lead_form', 'open_house', 'listing_page']);
    } else {
      query = query.eq('in_crm', true);
    }

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply source filter (e.g. 'lead_form' for leads-only view)
    if (source) {
      query = query.eq('source', source);
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
    let processedClients = clients?.map(client => {
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

      // Next incomplete reminder (earliest due)
      const incompleteReminders = reminders
        .filter((r: { is_completed: boolean }) => !r.is_completed)
        .sort(
          (a: { reminder_date: string }, b: { reminder_date: string }) =>
            new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime()
        );
      const nextReminderRow = incompleteReminders[0] || null;
      const nextReminder = nextReminderRow
        ? {
            id: nextReminderRow.id,
            title: nextReminderRow.title,
            reminder_date: nextReminderRow.reminder_date,
            is_overdue: new Date(nextReminderRow.reminder_date) < new Date(),
          }
        : null;

      const lastContactAt =
        latestNote?.created_at || client.updated_at || client.created_at;

      return {
        ...client,
        latest_note: latestNote,
        all_notes: sortedNotes, // Include all notes for carousel
        notes_count: notes.length,
        upcoming_reminders_count: upcomingReminders,
        next_reminder: nextReminder,
        last_contact_at: lastContactAt,
      };
    }) || [];

    if (view === 'inbox' && processedClients.length > 0) {
      const clientIds = processedClients.map((client) => client.id);

      const sequenceSummaries = await fetchLeadSequenceSummaries(supabase, user.id, clientIds);

      const { data: pendingSequences } = await supabase
        .from('email_sequences')
        .select('client_id')
        .in('client_id', clientIds)
        .eq('agent_user_id', user.id)
        .eq('status', 'pending');

      const legacyPendingByClient = new Set(pendingSequences?.map((row) => row.client_id) ?? []);

      processedClients = processedClients.map((client) => {
        const summary = sequenceSummaries.get(client.id);
        const followupActive = summary?.followup_active || legacyPendingByClient.has(client.id);
        return {
          ...client,
          followup_active: followupActive,
          sequence_awaiting_approval: summary?.awaiting_approval ?? false,
          lead_read: summary?.lead_read ?? null,
          sequence_next_step: summary?.next_step ?? null,
          sequence_temperature: summary?.temperature_at_enroll ?? null,
        };
      });
    }

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

    // Check usage limit
    const usage = await checkUsageLimit(supabase, user.id, 'clients');
    if (!usage.allowed) {
      return NextResponse.json(
        { success: false, error: usageLimitError('clients', usage.current, usage.limit, usage.plan) },
        { status: 403 }
      );
    }

    // Create client (goes directly to CRM)
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        status: 'active',
        source: 'manual',
        in_crm: true,
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

    await incrementUsage(supabase, user.id, 'clients');

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


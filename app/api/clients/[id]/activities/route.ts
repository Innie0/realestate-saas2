// @ts-nocheck
// GET/POST /api/clients/[id]/activities — client activity log
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const VALID_TYPES = ['call', 'email', 'showing'];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: clientId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const { data: activities, error } = await supabase
      .from('client_activities')
      .select('*')
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false });

    if (error) {
      console.error('Error fetching client activities:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: activities ?? [] });
  } catch (error) {
    console.error('Error in GET /api/clients/[id]/activities:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: clientId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const type = body.type;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const notes = typeof body.notes === 'string' ? body.notes.trim() || null : null;
    const occurredAt = body.occurred_at || new Date().toISOString();

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid activity type' },
        { status: 400 },
      );
    }

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 },
      );
    }

    const { data: activity, error } = await supabase
      .from('client_activities')
      .insert({
        client_id: clientId,
        user_id: user.id,
        type,
        title,
        notes,
        occurred_at: occurredAt,
        metadata: body.metadata ?? {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating client activity:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, data: activity, message: 'Activity logged' },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error in POST /api/clients/[id]/activities:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

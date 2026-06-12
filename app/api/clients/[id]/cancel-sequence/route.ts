// @ts-nocheck
// POST /api/clients/[id]/cancel-sequence
// Cancels all pending follow-up emails for a lead so the agent's
// manual outreach isn't followed up by automated messages.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the client belongs to this agent
    const { data: client, error: fetchError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !client) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const { error: cancelError } = await supabase
      .from('email_sequences')
      .update({ status: 'cancelled' })
      .eq('client_id', id)
      .eq('agent_user_id', user.id)
      .eq('status', 'pending');

    if (cancelError) {
      console.error('Error cancelling sequence:', cancelError);
      return NextResponse.json({ success: false, error: 'Failed to cancel emails' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Follow-up emails cancelled' });
  } catch (error) {
    console.error('Error in POST /api/clients/[id]/cancel-sequence:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

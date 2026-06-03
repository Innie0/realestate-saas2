// POST /api/clients/[id]/add-to-crm — promote an inbox lead to the CRM
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { checkUsageLimit, incrementUsage, usageLimitError } from '@/lib/usage';

const INBOX_SOURCES = ['lead_form', 'open_house'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: client, error: fetchError } = await supabase
      .from('clients')
      .select('id, in_crm, source')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !client) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    if (client.in_crm) {
      return NextResponse.json({
        success: true,
        data: client,
        message: 'Already in your CRM',
      });
    }

    if (!INBOX_SOURCES.includes(client.source)) {
      return NextResponse.json(
        { success: false, error: 'Only captured leads can be added from the inbox' },
        { status: 400 },
      );
    }

    const usage = await checkUsageLimit(supabase, user.id, 'clients');
    if (!usage.allowed) {
      return NextResponse.json(
        { success: false, error: usageLimitError('clients', usage.current, usage.limit, usage.plan) },
        { status: 403 },
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('clients')
      .update({ in_crm: true })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !updated) {
      console.error('Error adding lead to CRM:', updateError);
      return NextResponse.json({ success: false, error: 'Failed to add to CRM' }, { status: 500 });
    }

    await incrementUsage(supabase, user.id, 'clients');

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Added to your CRM',
    });
  } catch (error) {
    console.error('Error in POST /api/clients/[id]/add-to-crm:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { approveSequenceStep, processLeadSequenceSteps } from '@/lib/lead-sequences/process';

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

    const body = await request.json().catch(() => ({}));
    const { instanceId, subject, body: emailBody } = body;

    if (!instanceId) {
      return NextResponse.json({ success: false, error: 'instanceId is required' }, { status: 400 });
    }

    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const result = await approveSequenceStep({
      supabase,
      instanceId,
      agentId: user.id,
      subject,
      body: emailBody,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Send approved email immediately via admin client cron logic
    try {
      await processLeadSequenceSteps();
    } catch (cronErr) {
      console.error('[Sequence] post-approve send failed:', cronErr);
    }

    return NextResponse.json({ success: true, message: 'Email approved and queued to send' });
  } catch (error) {
    console.error('Error in POST /api/clients/[id]/sequence/approve:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { pauseLeadSequenceEnrollment } from '@/lib/lead-sequences/process';

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
    const paused = body.paused !== false;

    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    await pauseLeadSequenceEnrollment(supabase, id, user.id, paused);

    return NextResponse.json({
      success: true,
      message: paused ? 'Sequence paused' : 'Sequence resumed',
    });
  } catch (error) {
    console.error('Error in POST /api/clients/[id]/sequence/pause:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isMissingLeadSequenceSchemaError } from '@/lib/lead-sequences/templates';

export async function GET(
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

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    const { data: enrollment, error: enrollError } = await supabase
      .from('lead_sequence_enrollments')
      .select(`
        id, status, temperature_at_enroll, enrolled_at, completed_at,
        sequence_templates ( id, temperature, name ),
        lead_sequence_step_instances (
          id, step_index, step_type, status, due_at, sent_at, completed_at,
          subject, body, task_title, task_description, agent_approved_at, error_message
        )
      `)
      .eq('client_id', id)
      .eq('agent_user_id', user.id)
      .in('status', ['active', 'paused', 'completed'])
      .order('enrolled_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (enrollError && !isMissingLeadSequenceSchemaError(enrollError)) {
      return NextResponse.json({ success: false, error: enrollError.message }, { status: 500 });
    }

    const { data: insight } = await supabase
      .from('lead_ai_insights')
      .select('lead_read, recommended_tone, talking_points, email_angle, stale, generated_at')
      .eq('client_id', id)
      .eq('agent_user_id', user.id)
      .maybeSingle();

    const rawSteps = enrollment?.lead_sequence_step_instances;
    const steps = (Array.isArray(rawSteps) ? rawSteps : []).sort(
      (a, b) => a.step_index - b.step_index,
    );

    return NextResponse.json({
      success: true,
      data: {
        enrollment: enrollment
          ? {
              ...enrollment,
              lead_sequence_step_instances: steps,
            }
          : null,
        insight: insight || null,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/clients/[id]/sequence:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

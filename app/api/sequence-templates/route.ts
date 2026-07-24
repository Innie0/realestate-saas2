// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { ensureDefaultSequenceTemplates, isMissingLeadSequenceSchemaError } from '@/lib/lead-sequences/templates';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: settings } = await supabase
      .from('agent_settings')
      .select(`
        followup_email_1_day, followup_email_2_day, followup_email_3_day,
        followup_email_1_subject, followup_email_1_body,
        followup_email_2_subject, followup_email_2_body,
        followup_email_3_subject, followup_email_3_body
      `)
      .eq('user_id', user.id)
      .maybeSingle();

    await ensureDefaultSequenceTemplates(supabase, user.id, settings);

    const { data: templates, error } = await supabase
      .from('sequence_templates')
      .select(`
        id, temperature, name, is_active,
        sequence_template_steps (
          id, step_order, step_type, delay_minutes,
          subject_template, body_template, task_title, task_description,
          requires_agent_approval
        )
      `)
      .eq('agent_user_id', user.id)
      .order('temperature', { ascending: true });

    if (error) {
      if (isMissingLeadSequenceSchemaError(error)) {
        return NextResponse.json({ success: true, data: [], schema_missing: true });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const normalized = (templates || []).map((t) => ({
      ...t,
      sequence_template_steps: (t.sequence_template_steps || []).sort(
        (a: { step_order: number }, b: { step_order: number }) => a.step_order - b.step_order,
      ),
    }));

    return NextResponse.json({ success: true, data: normalized });
  } catch (error) {
    console.error('Error in GET /api/sequence-templates:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, steps } = body;

    if (!templateId || !Array.isArray(steps)) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const { data: template } = await supabase
      .from('sequence_templates')
      .select('id')
      .eq('id', templateId)
      .eq('agent_user_id', user.id)
      .single();

    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }

    for (const step of steps) {
      if (!step.id) continue;
      await supabase
        .from('sequence_template_steps')
        .update({
          delay_minutes: step.delay_minutes,
          subject_template: step.subject_template ?? null,
          body_template: step.body_template ?? null,
          task_title: step.task_title ?? null,
          task_description: step.task_description ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', step.id)
        .eq('template_id', templateId);
    }

    return NextResponse.json({ success: true, message: 'Template updated' });
  } catch (error) {
    console.error('Error in PUT /api/sequence-templates:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

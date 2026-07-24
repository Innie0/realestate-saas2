import type { SequenceTemplateStepRow } from '@/lib/lead-sequences/types';

type SupabaseLike = { from: (table: string) => any };

export async function scheduleNextSequenceStep(
  supabase: SupabaseLike,
  enrollmentId: string,
  completedStepIndex: number,
  templateSteps: SequenceTemplateStepRow[],
  fromTime: Date = new Date(),
): Promise<boolean> {
  const nextIndex = completedStepIndex + 1;
  const nextStep = templateSteps.find((s) => s.step_order === nextIndex);
  if (!nextStep) {
    await supabase
      .from('lead_sequence_enrollments')
      .update({
        status: 'completed',
        completed_at: fromTime.toISOString(),
        updated_at: fromTime.toISOString(),
      })
      .eq('id', enrollmentId)
      .eq('status', 'active');
    return false;
  }

  const dueAt = new Date(fromTime.getTime() + nextStep.delay_minutes * 60_000);
  const initialStatus =
    nextStep.step_type === 'email' && nextStep.requires_agent_approval
      ? 'awaiting_approval'
      : 'pending';

  const { error } = await supabase.from('lead_sequence_step_instances').insert({
    enrollment_id: enrollmentId,
    step_index: nextIndex,
    step_type: nextStep.step_type,
    status: initialStatus,
    due_at: dueAt.toISOString(),
    subject: nextStep.subject_template,
    body: nextStep.body_template,
    task_title: nextStep.task_title,
    task_description: nextStep.task_description,
  });

  if (error) {
    console.error('[Sequence] scheduleNext failed:', error.message);
    return false;
  }
  return true;
}

export async function getTemplateStepsForEnrollment(
  supabase: SupabaseLike,
  enrollmentId: string,
): Promise<{ templateId: string; steps: SequenceTemplateStepRow[] } | null> {
  const { data: enrollment, error } = await supabase
    .from('lead_sequence_enrollments')
    .select('template_id')
    .eq('id', enrollmentId)
    .single();

  if (error || !enrollment) return null;

  const { data: steps, error: stepsError } = await supabase
    .from('sequence_template_steps')
    .select(`
      id, template_id, step_order, step_type, delay_minutes,
      subject_template, body_template, task_title, task_description,
      requires_agent_approval
    `)
    .eq('template_id', enrollment.template_id)
    .order('step_order', { ascending: true });

  if (stepsError) return null;
  return { templateId: enrollment.template_id, steps: steps || [] };
}

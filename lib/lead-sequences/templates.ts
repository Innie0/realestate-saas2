import {
  DEFAULT_SEQUENCE_STEPS,
  mergeLegacyFollowupSettings,
  SEQUENCE_TEMPLATE_NAMES,
} from '@/lib/lead-sequences/defaults';
import type {
  SequenceTemplateRow,
  SequenceTemplateStepRow,
} from '@/lib/lead-sequences/types';
import type { LeadTemperature } from '@/lib/lead-temperature';
import type { FollowupSettings } from '@/lib/followup-emails';

type SupabaseLike = {
  from: (table: string) => any;
};

export function isMissingLeadSequenceSchemaError(error: { message?: string; code?: string } | null): boolean {
  const msg = (error?.message || '').toLowerCase();
  return (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    msg.includes('sequence_templates') ||
    msg.includes('lead_sequence_enrollments') ||
    msg.includes('could not find the table')
  );
}

export async function ensureDefaultSequenceTemplates(
  supabase: SupabaseLike,
  agentId: string,
  legacySettings?: FollowupSettings | null,
): Promise<Record<LeadTemperature, { template: SequenceTemplateRow; steps: SequenceTemplateStepRow[] }> | null> {
  const temperatures: LeadTemperature[] = ['hot', 'warm', 'cold'];
  const { data: existing, error: fetchError } = await supabase
    .from('sequence_templates')
    .select(`
      id, agent_user_id, temperature, name, is_active,
      sequence_template_steps (
        id, template_id, step_order, step_type, delay_minutes,
        subject_template, body_template, task_title, task_description,
        requires_agent_approval
      )
    `)
    .eq('agent_user_id', agentId);

  if (fetchError) {
    if (isMissingLeadSequenceSchemaError(fetchError)) return null;
    throw new Error(fetchError.message);
  }

  const byTemp = new Map<LeadTemperature, { template: SequenceTemplateRow; steps: SequenceTemplateStepRow[] }>();
  for (const row of existing || []) {
    const steps = (row.sequence_template_steps || []).sort(
      (a: SequenceTemplateStepRow, b: SequenceTemplateStepRow) => a.step_order - b.step_order,
    );
    byTemp.set(row.temperature as LeadTemperature, {
      template: {
        id: row.id,
        agent_user_id: row.agent_user_id,
        temperature: row.temperature,
        name: row.name,
        is_active: row.is_active,
      },
      steps,
    });
  }

  for (const temperature of temperatures) {
    if (byTemp.has(temperature)) continue;

    const defaultSteps = mergeLegacyFollowupSettings(
      temperature,
      DEFAULT_SEQUENCE_STEPS[temperature],
      legacySettings,
    );

    const { data: template, error: templateError } = await supabase
      .from('sequence_templates')
      .insert({
        agent_user_id: agentId,
        temperature,
        name: SEQUENCE_TEMPLATE_NAMES[temperature],
        is_active: true,
      })
      .select('id, agent_user_id, temperature, name, is_active')
      .single();

    if (templateError) {
      if (isMissingLeadSequenceSchemaError(templateError)) return null;
      throw new Error(templateError.message);
    }

    const stepRows = defaultSteps.map((step, step_order) => ({
      template_id: template.id,
      step_order,
      step_type: step.step_type,
      delay_minutes: step.delay_minutes,
      subject_template: step.subject_template ?? null,
      body_template: step.body_template ?? null,
      task_title: step.task_title ?? null,
      task_description: step.task_description ?? null,
      requires_agent_approval: step.requires_agent_approval ?? false,
    }));

    const { data: insertedSteps, error: stepsError } = await supabase
      .from('sequence_template_steps')
      .insert(stepRows)
      .select(`
        id, template_id, step_order, step_type, delay_minutes,
        subject_template, body_template, task_title, task_description,
        requires_agent_approval
      `);

    if (stepsError) {
      if (isMissingLeadSequenceSchemaError(stepsError)) return null;
      throw new Error(stepsError.message);
    }

    byTemp.set(temperature, {
      template,
      steps: (insertedSteps || []).sort(
        (a: SequenceTemplateStepRow, b: SequenceTemplateStepRow) => a.step_order - b.step_order,
      ),
    });
  }

  return {
    hot: byTemp.get('hot')!,
    warm: byTemp.get('warm')!,
    cold: byTemp.get('cold')!,
  };
}

export async function getSequenceTemplateForTemperature(
  supabase: SupabaseLike,
  agentId: string,
  temperature: LeadTemperature,
  legacySettings?: FollowupSettings | null,
): Promise<{ template: SequenceTemplateRow; steps: SequenceTemplateStepRow[] } | null> {
  const all = await ensureDefaultSequenceTemplates(supabase, agentId, legacySettings);
  return all?.[temperature] ?? null;
}

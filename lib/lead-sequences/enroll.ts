import { resolveAgentReplyEmail } from '@/lib/agent-reply-email';
import {
  generateLeadInsights,
  generatePersonalizedSequenceEmail,
  upsertLeadAiInsights,
} from '@/lib/ai-lead-insights';
import { applyMergeTags, type FollowupSettings, type LeadFollowupContext } from '@/lib/followup-emails';
import { parseLeadFieldsFromMessage } from '@/lib/lead-sequences/defaults';
import { getSequenceTemplateForTemperature, isMissingLeadSequenceSchemaError } from '@/lib/lead-sequences/templates';
import type { LeadSequenceContext } from '@/lib/lead-sequences/types';
import { getLeadTemperature } from '@/lib/lead-temperature';

type SupabaseLike = {
  from: (table: string) => any;
  auth: { admin: { getUserById: (id: string) => Promise<{ data: { user?: { email?: string; user_metadata?: { full_name?: string } } } }> } };
};

export type EnrollLeadSequenceOptions = {
  supabase: SupabaseLike;
  clientId: string;
  agentId: string;
  leadName: string;
  leadEmail: string;
  leadType?: string | null;
  message?: string | null;
  source?: string | null;
  area?: string;
  settings?: FollowupSettings | null;
  capturedAt?: Date;
};

export async function enrollLeadInSequence(options: EnrollLeadSequenceOptions): Promise<{ enrolled: boolean; reason?: string }> {
  const {
    supabase,
    clientId,
    agentId,
    leadName,
    leadEmail,
    leadType,
    message,
    source,
    area: areaOverride,
    settings,
    capturedAt = new Date(),
  } = options;

  const parsed = parseLeadFieldsFromMessage(message || '');
  const area = areaOverride || parsed.area;
  const temperature = getLeadTemperature(capturedAt.toISOString(), message || '');

  const { data: activeEnrollment } = await supabase
    .from('lead_sequence_enrollments')
    .select('id')
    .eq('client_id', clientId)
    .eq('status', 'active')
    .maybeSingle();

  if (activeEnrollment) {
    return { enrolled: false, reason: 'already_active' };
  }

  const templateBundle = await getSequenceTemplateForTemperature(
    supabase,
    agentId,
    temperature,
    settings,
  );

  if (!templateBundle) {
    return { enrolled: false, reason: 'schema_missing' };
  }

  const { template, steps } = templateBundle;
  const firstStep = steps[0];
  if (!firstStep) {
    return { enrolled: false, reason: 'no_steps' };
  }

  const { data: agentUser } = await supabase.auth.admin.getUserById(agentId);
  const agentName = agentUser?.user?.user_metadata?.full_name || 'Your Agent';
  const agentReplyEmail = resolveAgentReplyEmail({
    profileEmail: (settings as { profile_email?: string | null } | null)?.profile_email,
    authEmail: agentUser?.user?.email,
  });

  const sequenceContext: LeadSequenceContext = {
    clientId,
    agentId,
    leadName,
    leadEmail,
    leadType,
    message,
    source,
    area,
    budget: parsed.budget,
    timeline: parsed.timeline,
    temperature,
  };

  const mergeContext: LeadFollowupContext = {
    leadName,
    leadEmail,
    agentName,
    agentReplyEmail,
    leadType,
    area,
  };

  const insight = await generateLeadInsights(sequenceContext, agentName);
  await upsertLeadAiInsights(supabase, agentId, clientId, insight);

  let subject = firstStep.subject_template || '';
  let body = firstStep.body_template || '';

  if (firstStep.step_type === 'email') {
    const personalized = await generatePersonalizedSequenceEmail({
      context: sequenceContext,
      insight,
      mergeContext,
      subjectTemplate: subject,
      bodyTemplate: body,
      stepIndex: 0,
    });
    subject = personalized.subject;
    body = personalized.body;
  }

  if (firstStep.step_type === 'task') {
    subject = applyMergeTags(firstStep.task_title || 'Follow up', mergeContext);
    body = applyMergeTags(firstStep.task_description || '', mergeContext);
  }

  const initialStatus =
    firstStep.step_type === 'email' && firstStep.requires_agent_approval
      ? 'awaiting_approval'
      : 'pending';

  const dueAt =
    firstStep.delay_minutes > 0
      ? new Date(capturedAt.getTime() + firstStep.delay_minutes * 60_000)
      : capturedAt;

  const { data: enrollment, error: enrollError } = await supabase
    .from('lead_sequence_enrollments')
    .insert({
      client_id: clientId,
      agent_user_id: agentId,
      template_id: template.id,
      temperature_at_enroll: temperature,
      status: 'active',
      enrolled_at: capturedAt.toISOString(),
    })
    .select('id')
    .single();

  if (enrollError) {
    if (isMissingLeadSequenceSchemaError(enrollError)) {
      return { enrolled: false, reason: 'schema_missing' };
    }
    throw new Error(enrollError.message);
  }

  const { error: stepError } = await supabase.from('lead_sequence_step_instances').insert({
    enrollment_id: enrollment.id,
    step_index: 0,
    step_type: firstStep.step_type,
    status: initialStatus,
    due_at: dueAt.toISOString(),
    subject: firstStep.step_type === 'email' ? subject : null,
    body: firstStep.step_type === 'email' ? body : null,
    task_title: firstStep.step_type === 'task' ? subject : null,
    task_description: firstStep.step_type === 'task' ? body : null,
  });

  if (stepError) {
    console.error('[Sequence] step 0 insert failed:', stepError.message);
    await supabase.from('lead_sequence_enrollments').update({ status: 'cancelled' }).eq('id', enrollment.id);
    return { enrolled: false, reason: 'step_failed' };
  }

  return { enrolled: true };
}

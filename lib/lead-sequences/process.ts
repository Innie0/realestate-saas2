import { createAdminClient } from '@/lib/supabase-admin';
import { formatReplyToHeader, resolveAgentReplyEmail } from '@/lib/agent-reply-email';
import {
  generatePersonalizedSequenceEmail,
} from '@/lib/ai-lead-insights';
import {
  applyMergeTags,
  type FollowupSettings,
  type LeadFollowupContext,
} from '@/lib/followup-emails';
import { parseLeadFieldsFromMessage } from '@/lib/lead-sequences/defaults';
import { getTemplateStepsForEnrollment, scheduleNextSequenceStep } from '@/lib/lead-sequences/schedule-next';
import type { LeadSequenceContext } from '@/lib/lead-sequences/types';
import { getResendErrorMessage, sendEmail } from '@/lib/resend';
import { SITE_FONT_STACK } from '@/lib/site-config';
import { getSupportFrom } from '@/lib/support-email';

export type ProcessLeadSequencesResult = {
  emailsSent: number;
  tasksCreated: number;
  failed: number;
  message?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function textToEmailHtml(text: string): string {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return '';

  return paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">${escapeHtml(paragraph).replace(/\n/g, '<br/>')}</p>`,
    )
    .join('');
}

function wrapEmailHtml(body: string, agentName: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:${SITE_FONT_STACK};">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="padding:32px 28px;">${body}</div>
    <div style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">Sent on behalf of ${escapeHtml(agentName)} via Oikaro</p>
    </div>
  </div>
</body>
</html>`;
}

export async function processLeadSequenceSteps(): Promise<ProcessLeadSequencesResult> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: dueSteps, error } = await supabase
    .from('lead_sequence_step_instances')
    .select(`
      id, enrollment_id, step_index, step_type, status, due_at,
      subject, body, task_title, task_description, agent_approved_at,
      lead_sequence_enrollments!inner (
        id, client_id, agent_user_id, status, temperature_at_enroll, template_id,
        clients!inner ( id, name, email, lead_type, message, source, created_at )
      )
    `)
    .eq('status', 'pending')
    .lte('due_at', now)
    .eq('lead_sequence_enrollments.status', 'active')
    .limit(50);

  if (error) {
    const msg = (error.message || '').toLowerCase();
    if (msg.includes('lead_sequence') || error.code === '42P01' || error.code === 'PGRST205') {
      return { emailsSent: 0, tasksCreated: 0, failed: 0, message: 'Sequence tables not migrated' };
    }
    throw new Error(error.message);
  }

  if (!dueSteps || dueSteps.length === 0) {
    return { emailsSent: 0, tasksCreated: 0, failed: 0, message: 'No pending sequence steps' };
  }

  let emailsSent = 0;
  let tasksCreated = 0;
  let failed = 0;

  for (const row of dueSteps) {
    try {
      const enrollment = Array.isArray(row.lead_sequence_enrollments)
        ? row.lead_sequence_enrollments[0]
        : row.lead_sequence_enrollments;
      const client = Array.isArray(enrollment?.clients)
        ? enrollment.clients[0]
        : enrollment?.clients;

      if (!enrollment || !client?.email) {
        await supabase
          .from('lead_sequence_step_instances')
          .update({ status: 'cancelled', updated_at: now })
          .eq('id', row.id);
        continue;
      }

      const templateBundle = await getTemplateStepsForEnrollment(supabase, enrollment.id);
      if (!templateBundle) {
        failed++;
        continue;
      }

      const templateStep = templateBundle.steps.find((s) => s.step_order === row.step_index);
      if (
        templateStep?.step_type === 'email' &&
        templateStep.requires_agent_approval &&
        !row.agent_approved_at
      ) {
        continue;
      }

      const { data: agentUser } = await supabase.auth.admin.getUserById(enrollment.agent_user_id);
      const agentName = agentUser?.user?.user_metadata?.full_name || 'Your Agent';

      const { data: agentSettings } = await supabase
        .from('agent_settings')
        .select('profile_email')
        .eq('user_id', enrollment.agent_user_id)
        .maybeSingle();

      const agentReplyEmail = resolveAgentReplyEmail({
        profileEmail: agentSettings?.profile_email,
        authEmail: agentUser?.user?.email,
      });

      const parsed = parseLeadFieldsFromMessage(client.message || '');
      const mergeContext: LeadFollowupContext = {
        leadName: client.name,
        leadEmail: client.email,
        agentName,
        agentReplyEmail,
        leadType: client.lead_type,
        area: parsed.area,
      };

      const completedAt = new Date();

      if (row.step_type === 'task') {
        const title = applyMergeTags(row.task_title || 'Follow up with lead', mergeContext);
        const description = applyMergeTags(row.task_description || '', mergeContext);

        const { data: reminder, error: reminderError } = await supabase
          .from('reminders')
          .insert({
            client_id: client.id,
            user_id: enrollment.agent_user_id,
            title,
            description: description || null,
            reminder_date: completedAt.toISOString(),
            is_completed: false,
          })
          .select('id')
          .single();

        if (reminderError) throw new Error(reminderError.message);

        await supabase
          .from('lead_sequence_step_instances')
          .update({
            status: 'completed',
            completed_at: completedAt.toISOString(),
            reminder_id: reminder.id,
            updated_at: completedAt.toISOString(),
          })
          .eq('id', row.id);

        await scheduleNextSequenceStep(
          supabase,
          enrollment.id,
          row.step_index,
          templateBundle.steps,
          completedAt,
        );
        tasksCreated++;
        continue;
      }

      // Email step
      let subject = row.subject || templateStep?.subject_template || 'Following up';
      let body = row.body || templateStep?.body_template || '';

      if (row.step_index > 0) {
        const { data: insightRow } = await supabase
          .from('lead_ai_insights')
          .select('lead_read, recommended_tone, talking_points, email_angle')
          .eq('client_id', client.id)
          .maybeSingle();

        const sequenceContext: LeadSequenceContext = {
          clientId: client.id,
          agentId: enrollment.agent_user_id,
          leadName: client.name,
          leadEmail: client.email,
          leadType: client.lead_type,
          message: client.message,
          source: client.source,
          area: parsed.area,
          budget: parsed.budget,
          timeline: parsed.timeline,
          temperature: enrollment.temperature_at_enroll,
        };

        const insight = insightRow
          ? {
              lead_read: insightRow.lead_read || '',
              recommended_tone: insightRow.recommended_tone || 'helpful',
              talking_points: (insightRow.talking_points as string[]) || [],
              email_angle: insightRow.email_angle || '',
            }
          : {
              lead_read: `${client.name} follow-up`,
              recommended_tone: 'helpful',
              talking_points: [],
              email_angle: 'Check in and offer next steps',
            };

        const personalized = await generatePersonalizedSequenceEmail({
          context: sequenceContext,
          insight,
          mergeContext,
          subjectTemplate: templateStep?.subject_template || subject,
          bodyTemplate: templateStep?.body_template || body,
          stepIndex: row.step_index,
        });
        subject = personalized.subject;
        body = personalized.body;
      }

      const html = wrapEmailHtml(textToEmailHtml(body), agentName);
      await sendEmail({
        from: getSupportFrom(),
        to: client.email,
        subject,
        html,
        reply_to: agentReplyEmail
          ? formatReplyToHeader(agentReplyEmail, agentName)
          : undefined,
      });

      await supabase
        .from('lead_sequence_step_instances')
        .update({
          status: 'sent',
          sent_at: completedAt.toISOString(),
          subject,
          body,
          updated_at: completedAt.toISOString(),
        })
        .eq('id', row.id);

      await scheduleNextSequenceStep(
        supabase,
        enrollment.id,
        row.step_index,
        templateBundle.steps,
        completedAt,
      );
      emailsSent++;
    } catch (err) {
      const message = getResendErrorMessage(err);
      console.error(`[Cron/Sequences] Failed step ${row.id}:`, message);
      await supabase
        .from('lead_sequence_step_instances')
        .update({
          status: 'failed',
          error_message: message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      failed++;
    }
  }

  return { emailsSent, tasksCreated, failed };
}

export async function approveSequenceStep(options: {
  supabase: { from: (table: string) => any };
  instanceId: string;
  agentId: string;
  subject?: string;
  body?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { supabase, instanceId, agentId, subject, body } = options;
  const now = new Date().toISOString();

  const { data: instance, error } = await supabase
    .from('lead_sequence_step_instances')
    .select(`
      id, status, step_index, enrollment_id,
      lead_sequence_enrollments!inner ( agent_user_id, status )
    `)
    .eq('id', instanceId)
    .single();

  if (error || !instance) {
    return { success: false, error: 'Step not found' };
  }

  const enrollment = Array.isArray(instance.lead_sequence_enrollments)
    ? instance.lead_sequence_enrollments[0]
    : instance.lead_sequence_enrollments;

  if (enrollment?.agent_user_id !== agentId) {
    return { success: false, error: 'Unauthorized' };
  }

  if (instance.status !== 'awaiting_approval') {
    return { success: false, error: 'Step is not awaiting approval' };
  }

  const updates: Record<string, string> = {
    status: 'pending',
    agent_approved_at: now,
    due_at: now,
    updated_at: now,
  };
  if (subject) updates.subject = subject;
  if (body) updates.body = body;

  const { error: updateError } = await supabase
    .from('lead_sequence_step_instances')
    .update(updates)
    .eq('id', instanceId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

export async function skipSequenceStep(options: {
  supabase: { from: (table: string) => any };
  instanceId: string;
  agentId: string;
}): Promise<{ success: boolean; error?: string }> {
  const { supabase, instanceId, agentId } = options;
  const now = new Date();

  const { data: instance, error } = await supabase
    .from('lead_sequence_step_instances')
    .select(`
      id, step_index, enrollment_id, status,
      lead_sequence_enrollments!inner ( agent_user_id, status )
    `)
    .eq('id', instanceId)
    .single();

  if (error || !instance) return { success: false, error: 'Step not found' };

  const enrollment = Array.isArray(instance.lead_sequence_enrollments)
    ? instance.lead_sequence_enrollments[0]
    : instance.lead_sequence_enrollments;

  if (enrollment?.agent_user_id !== agentId) {
    return { success: false, error: 'Unauthorized' };
  }

  if (!['awaiting_approval', 'pending'].includes(instance.status)) {
    return { success: false, error: 'Step cannot be skipped' };
  }

  await supabase
    .from('lead_sequence_step_instances')
    .update({ status: 'skipped', updated_at: now.toISOString() })
    .eq('id', instanceId);

  const templateBundle = await getTemplateStepsForEnrollment(supabase, instance.enrollment_id);
  if (templateBundle) {
    await scheduleNextSequenceStep(
      supabase,
      instance.enrollment_id,
      instance.step_index,
      templateBundle.steps,
      now,
    );
  }

  return { success: true };
}

export async function retryFailedSequenceStep(options: {
  supabase: { from: (table: string) => any };
  instanceId: string;
  agentId: string;
}): Promise<{ success: boolean; error?: string; sendError?: string }> {
  const { supabase, instanceId, agentId } = options;
  const now = new Date().toISOString();

  const { data: instance, error } = await supabase
    .from('lead_sequence_step_instances')
    .select(`
      id, status, enrollment_id,
      lead_sequence_enrollments!inner ( agent_user_id, status )
    `)
    .eq('id', instanceId)
    .single();

  if (error || !instance) return { success: false, error: 'Step not found' };

  const enrollment = Array.isArray(instance.lead_sequence_enrollments)
    ? instance.lead_sequence_enrollments[0]
    : instance.lead_sequence_enrollments;

  if (enrollment?.agent_user_id !== agentId) {
    return { success: false, error: 'Unauthorized' };
  }

  if (instance.status !== 'failed') {
    return { success: false, error: 'Only failed steps can be retried' };
  }

  if (enrollment?.status !== 'active') {
    return { success: false, error: 'Sequence is not active' };
  }

  const { error: updateError } = await supabase
    .from('lead_sequence_step_instances')
    .update({
      status: 'pending',
      due_at: now,
      error_message: null,
      updated_at: now,
    })
    .eq('id', instanceId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  try {
    const result = await processLeadSequenceSteps();
    if (result.failed > 0) {
      return {
        success: false,
        error: 'Email could not be sent. Check your Resend domain configuration.',
      };
    }
    if (result.emailsSent === 0 && result.tasksCreated === 0) {
      return { success: false, error: 'Step was queued but not processed yet. Try again in a moment.' };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: getResendErrorMessage(err) };
  }
}

export async function pauseLeadSequenceEnrollment(
  supabase: { from: (table: string) => any },
  clientId: string,
  agentId: string,
  paused: boolean,
): Promise<void> {
  await supabase
    .from('lead_sequence_enrollments')
    .update({
      status: paused ? 'paused' : 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('client_id', clientId)
    .eq('agent_user_id', agentId)
    .in('status', paused ? ['active'] : ['paused']);
}

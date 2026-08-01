import type { SequenceTemplateStepRow, StepInstanceStatus } from '@/lib/lead-sequences/types';
import type { LeadTemperature } from '@/lib/lead-temperature';

export type SchedulePreviewStep = {
  step_index: number;
  step_type: 'email' | 'task';
  label: string;
  status: StepInstanceStatus | 'upcoming';
  due_at: string;
  projected: boolean;
  instance_id?: string;
  error_message?: string | null;
  requires_agent_approval?: boolean;
};

export type StepInstanceForPreview = {
  id: string;
  step_index: number;
  step_type: string;
  status: string;
  due_at: string;
  sent_at?: string | null;
  completed_at?: string | null;
  subject?: string | null;
  body?: string | null;
  task_title?: string | null;
  error_message?: string | null;
};

function labelFromTemplate(step: SequenceTemplateStepRow): string {
  if (step.step_type === 'task') {
    return step.task_title || 'Call reminder';
  }
  return step.subject_template || 'Follow-up email';
}

function labelFromInstance(
  instance: StepInstanceForPreview,
  template?: SequenceTemplateStepRow,
): string {
  if (instance.step_type === 'task') {
    return instance.task_title || template?.task_title || 'Call reminder';
  }
  return instance.subject || template?.subject_template || 'Follow-up email';
}

function resolveCursorAfterInstance(instance: StepInstanceForPreview): Date {
  if (instance.sent_at) return new Date(instance.sent_at);
  if (instance.completed_at) return new Date(instance.completed_at);
  return new Date(instance.due_at);
}

export function buildSchedulePreview(options: {
  enrolledAt: string;
  enrollmentStatus: string;
  templateSteps: SequenceTemplateStepRow[];
  instances: StepInstanceForPreview[];
}): SchedulePreviewStep[] {
  const { enrolledAt, enrollmentStatus, templateSteps, instances } = options;
  const sortedTemplates = [...templateSteps].sort((a, b) => a.step_order - b.step_order);
  const instancesByIndex = new Map(instances.map((instance) => [instance.step_index, instance]));

  const preview: SchedulePreviewStep[] = [];
  let cursor = new Date(enrolledAt);

  for (const templateStep of sortedTemplates) {
    const instance = instancesByIndex.get(templateStep.step_order);

    if (instance) {
      preview.push({
        step_index: templateStep.step_order,
        step_type: templateStep.step_type,
        label: labelFromInstance(instance, templateStep),
        status: instance.status as StepInstanceStatus,
        due_at: instance.due_at,
        projected: false,
        instance_id: instance.id,
        error_message: instance.error_message ?? null,
        requires_agent_approval: templateStep.requires_agent_approval,
      });
      cursor = resolveCursorAfterInstance(instance);
      continue;
    }

    const dueAt = new Date(cursor.getTime() + templateStep.delay_minutes * 60_000);
    const upcomingStatus: SchedulePreviewStep['status'] =
      enrollmentStatus === 'paused' ? 'pending' : 'upcoming';

    preview.push({
      step_index: templateStep.step_order,
      step_type: templateStep.step_type,
      label: labelFromTemplate(templateStep),
      status: upcomingStatus,
      due_at: dueAt.toISOString(),
      projected: true,
      requires_agent_approval: templateStep.requires_agent_approval,
    });
    cursor = dueAt;
  }

  return preview;
}

export function formatScheduleStepDate(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'TBD';

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTarget = new Date(date);
  startOfTarget.setHours(0, 0, 0, 0);

  const dayDiff = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000),
  );

  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (dayDiff === 0) return `Today · ${time}`;
  if (dayDiff === 1) return `Tomorrow · ${time}`;
  if (dayDiff === -1) return `Yesterday · ${time}`;

  const dateLabel = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return `${dateLabel} · ${time}`;
}

export function formatScheduleSummary(
  steps: SchedulePreviewStep[],
  temperature?: LeadTemperature | null,
): string {
  const total = steps.length;
  const next = steps.find((step) =>
    ['awaiting_approval', 'pending', 'upcoming'].includes(step.status),
  );

  const tempLabel = temperature ? `${temperature.charAt(0).toUpperCase()}${temperature.slice(1)} sequence` : 'Sequence';
  const touchpoints = `${total} touchpoint${total === 1 ? '' : 's'}`;

  if (!next) {
    return `${tempLabel} · ${touchpoints} · complete`;
  }

  const nextLabel = next.step_type === 'task' ? 'Call reminder' : 'Email';
  return `${tempLabel} · ${touchpoints} · next ${nextLabel.toLowerCase()} ${formatScheduleStepDate(next.due_at)}`;
}

export function scheduleStepTypeLabel(stepType: 'email' | 'task'): string {
  return stepType === 'task' ? 'Call / task' : 'Email';
}

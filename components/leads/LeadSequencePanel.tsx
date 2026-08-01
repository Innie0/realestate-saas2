'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2, SkipForward, Pause, Play, RotateCcw, Mail, PhoneCall } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/components/providers/ToastProvider';
import { useApi } from '@/lib/swr';
import LeadTemperatureBadge, { type LeadTemperature } from '@/components/dashboard/LeadTemperatureBadge';
import {
  formatScheduleStepDate,
  formatScheduleSummary,
  scheduleStepTypeLabel,
  type SchedulePreviewStep,
} from '@/lib/lead-sequences/schedule-preview';
import { cn } from '@/lib/utils';

type StepInstance = {
  id: string;
  step_index: number;
  step_type: string;
  status: string;
  due_at: string;
  subject?: string | null;
  body?: string | null;
  task_title?: string | null;
  agent_approved_at?: string | null;
  error_message?: string | null;
};

type SequenceApiData = {
  enrollment: {
    id: string;
    status: string;
    temperature_at_enroll: LeadTemperature;
    enrolled_at: string;
    lead_sequence_step_instances: StepInstance[];
  } | null;
  schedule: SchedulePreviewStep[];
  insight: {
    lead_read?: string | null;
    recommended_tone?: string | null;
    talking_points?: string[];
    email_angle?: string | null;
    stale?: boolean;
  } | null;
};

type LeadSequencePanelProps = {
  leadId: string;
  leadName: string;
  autoFollowupEnabled: boolean;
  onSequenceChange?: () => void;
};

function statusLabel(status: SchedulePreviewStep['status'], projected: boolean): string {
  if (projected && status === 'upcoming') return 'Planned';
  const labels: Record<string, string> = {
    awaiting_approval: 'Needs approval',
    pending: 'Scheduled',
    upcoming: 'Planned',
    sent: 'Sent',
    completed: 'Done',
    skipped: 'Skipped',
    cancelled: 'Cancelled',
    failed: 'Failed',
  };
  return labels[status] || status;
}

function asCopy(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function stepIcon(stepType: SchedulePreviewStep['step_type']) {
  return stepType === 'task' ? PhoneCall : Mail;
}

export default function LeadSequencePanel({
  leadId,
  leadName,
  autoFollowupEnabled,
  onSequenceChange,
}: LeadSequencePanelProps) {
  const toast = useToast();
  const { data: sequence, mutate, isLoading } = useApi<SequenceApiData>(
    autoFollowupEnabled ? `/api/clients/${leadId}/sequence` : null,
  );

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  const enrollment = sequence?.enrollment;
  const insight = sequence?.insight;
  const schedule = Array.isArray(sequence?.schedule) ? sequence.schedule : [];
  const steps = Array.isArray(enrollment?.lead_sequence_step_instances)
    ? enrollment.lead_sequence_step_instances
    : [];
  const approvalStep = steps.find((s) => s.status === 'awaiting_approval');

  const scheduleSummary =
    enrollment && schedule.length > 0
      ? formatScheduleSummary(schedule, enrollment.temperature_at_enroll)
      : null;

  if (!autoFollowupEnabled) return null;

  if (isLoading && !enrollment) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading schedule…
      </div>
    );
  }

  if (!enrollment) {
    return (
      <p className="text-sm text-muted-foreground">
        No active sequence for this lead (legacy follow-up may still apply).
      </p>
    );
  }

  const currentSubject = subject || asCopy(approvalStep?.subject);
  const currentBody = body || asCopy(approvalStep?.body);

  const handleApprove = async () => {
    if (!approvalStep) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/clients/${leadId}/sequence/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: approvalStep.id,
          subject: currentSubject,
          body: currentBody,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('First email approved — sending shortly');
        setSubject('');
        setBody('');
        mutate();
        onSequenceChange?.();
      } else {
        toast.error(result.error || 'Could not approve email');
      }
    } catch {
      toast.error('Could not approve email');
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = async () => {
    if (!approvalStep) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/clients/${leadId}/sequence/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId: approvalStep.id }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Step skipped');
        mutate();
        onSequenceChange?.();
      } else {
        toast.error(result.error || 'Could not skip step');
      }
    } finally {
      setBusy(false);
    }
  };

  const handlePause = async (paused: boolean) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/clients/${leadId}/sequence/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(paused ? 'Sequence paused' : 'Sequence resumed');
        mutate();
        onSequenceChange?.();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRetry = async (instanceId: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/clients/${leadId}/sequence/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instanceId }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Email sent successfully');
        mutate();
        onSequenceChange?.();
      } else {
        toast.error(result.error || 'Could not retry email');
      }
    } catch {
      toast.error('Could not retry email');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {typeof insight?.lead_read === 'string' && insight.lead_read.trim() ? (
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Lead summary
          </p>
          <p className="mt-1 text-sm text-foreground">{insight.lead_read}</p>
          {insight.recommended_tone ? (
            <p className="mt-1 text-xs text-muted-foreground">Suggested tone: {insight.recommended_tone}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <LeadTemperatureBadge temperature={enrollment.temperature_at_enroll ?? 'warm'} />
        <span className="text-xs text-muted-foreground capitalize">{enrollment.status} sequence</span>
        {enrollment.status === 'active' ? (
          <Button size="sm" variant="outline" className="ml-auto h-7 gap-1 text-xs" onClick={() => handlePause(true)} disabled={busy}>
            <Pause className="size-3" />
            Pause
          </Button>
        ) : enrollment.status === 'paused' ? (
          <Button size="sm" variant="outline" className="ml-auto h-7 gap-1 text-xs" onClick={() => handlePause(false)} disabled={busy}>
            <Play className="size-3" />
            Resume
          </Button>
        ) : null}
      </div>

      {approvalStep ? (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Approve first email to {(leadName || 'lead').split(' ')[0]}
            </CardTitle>
            <CardDescription>Review AI-drafted copy before it sends.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">Subject</span>
              <input
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={currentSubject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">Body</span>
              <textarea
                rows={6}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={currentBody}
                onChange={(e) => setBody(e.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleApprove} disabled={busy} isLoading={busy} className="gap-1.5">
                <CheckCircle2 className="size-4" />
                Approve & send
              </Button>
              <Button size="sm" variant="outline" onClick={handleSkip} disabled={busy} className="gap-1.5">
                <SkipForward className="size-4" />
                Skip
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div>
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Follow-up schedule
          </p>
          {scheduleSummary ? (
            <p className="text-xs text-muted-foreground">{scheduleSummary}</p>
          ) : null}
        </div>
        <ol className="relative flex flex-col gap-0">
          {schedule.map((step, index) => {
            const Icon = stepIcon(step.step_type);
            const isLast = index === schedule.length - 1;
            const isDone = step.status === 'sent' || step.status === 'completed';
            const isFailed = step.status === 'failed';

            return (
              <li key={`${step.step_index}-${step.instance_id ?? 'planned'}`} className="relative flex gap-3 pb-4 last:pb-0">
                {!isLast ? (
                  <span
                    aria-hidden
                    className={cn(
                      'absolute left-[11px] top-6 bottom-0 w-px',
                      isDone ? 'bg-emerald-300/80' : 'bg-border',
                    )}
                  />
                ) : null}
                <div
                  className={cn(
                    'relative z-[1] mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground',
                    isFailed && 'border-rose-300 bg-rose-50 text-rose-700',
                    step.status === 'awaiting_approval' && 'border-amber-300 bg-amber-50 text-amber-800',
                    isDone && 'border-emerald-300 bg-emerald-50 text-emerald-700',
                    step.projected && 'border-dashed bg-muted/40 text-muted-foreground',
                    step.status === 'skipped' && 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="size-3" />
                </div>
                <div
                  className={cn(
                    'min-w-0 flex-1 rounded-md border px-3 py-2.5',
                    step.status === 'awaiting_approval' && 'border-amber-200 bg-amber-50/50',
                    isFailed && 'border-rose-200 bg-rose-50/50',
                    isDone && 'border-emerald-200/80 bg-emerald-50/40',
                    step.projected && 'border-dashed border-border bg-muted/20',
                    !step.projected && !isDone && !isFailed && step.status !== 'awaiting_approval'
                      ? 'border-border bg-muted/30'
                      : '',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        {scheduleStepTypeLabel(step.step_type)}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-foreground">{step.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatScheduleStepDate(step.due_at)}
                        {step.projected ? ' · estimated' : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {statusLabel(step.status, step.projected)}
                    </span>
                  </div>
                  {step.status === 'failed' && step.error_message ? (
                    <p className="mt-2 text-xs text-rose-700">{step.error_message}</p>
                  ) : null}
                  {step.status === 'failed' && step.step_type === 'email' && step.instance_id ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 h-7 gap-1 text-xs"
                      onClick={() => handleRetry(step.instance_id!)}
                      disabled={busy}
                      isLoading={busy}
                    >
                      <RotateCcw className="size-3" />
                      Retry send
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Loader2, Save, Flame, Thermometer, Snowflake } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn-tabs';
import { useToast } from '@/components/providers/ToastProvider';
import { useApi } from '@/lib/swr';
import type { LeadTemperature } from '@/lib/lead-temperature';

type TemplateStep = {
  id: string;
  step_order: number;
  step_type: 'email' | 'task';
  delay_minutes: number;
  subject_template?: string | null;
  body_template?: string | null;
  task_title?: string | null;
  task_description?: string | null;
  requires_agent_approval: boolean;
};

type SequenceTemplate = {
  id: string;
  temperature: LeadTemperature;
  name: string;
  sequence_template_steps: TemplateStep[];
};

const TEMP_ICONS = {
  hot: Flame,
  warm: Thermometer,
  cold: Snowflake,
};

function formatDelay(minutes: number): string {
  if (minutes === 0) return 'Immediately after previous step';
  if (minutes < 60) return `${minutes}m after previous step`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h after previous step`;
  return `${Math.round(minutes / 1440)}d after previous step`;
}

export default function SequenceTemplatesEditor() {
  const toast = useToast();
  const { data: templates, response, mutate, isLoading } = useApi<SequenceTemplate[]>(
    '/api/sequence-templates',
  );
  const templateList = templates || [];
  const [activeTemp, setActiveTemp] = useState<LeadTemperature>('hot');
  const [drafts, setDrafts] = useState<Record<string, TemplateStep[]>>({});
  const [saving, setSaving] = useState(false);

  const activeTemplate = useMemo(
    () => templateList.find((t) => t.temperature === activeTemp),
    [templateList, activeTemp],
  );

  const steps = useMemo(() => {
    if (!activeTemplate) return [];
    const key = activeTemplate.id;
    if (drafts[key]) return drafts[key];
    return activeTemplate.sequence_template_steps;
  }, [activeTemplate, drafts]);

  const updateStep = (stepId: string, patch: Partial<TemplateStep>) => {
    if (!activeTemplate) return;
    const current = drafts[activeTemplate.id] || activeTemplate.sequence_template_steps;
    setDrafts({
      ...drafts,
      [activeTemplate.id]: current.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
    });
  };

  const handleSave = async () => {
    if (!activeTemplate) return;
    setSaving(true);
    try {
      const res = await fetch('/api/sequence-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: activeTemplate.id,
          steps,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`${activeTemplate.name} saved`);
        mutate();
      } else {
        toast.error(result.error || 'Could not save');
      }
    } catch {
      toast.error('Could not save');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading sequences…
      </div>
    );
  }

  if (response?.schema_missing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Multi-step sequences</CardTitle>
          <CardDescription>
            Run <code className="text-xs">lead-sequence-schema.sql</code> in Supabase to enable Hot / Warm / Cold
            sequences with AI personalization.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow-up sequences</CardTitle>
        <CardDescription>
          Hot, warm, and cold multi-step paths. The first email in each sequence requires your approval; later steps
          personalize automatically with AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Tabs value={activeTemp} onValueChange={(v) => setActiveTemp(v as LeadTemperature)}>
          <TabsList>
            {(['hot', 'warm', 'cold'] as LeadTemperature[]).map((temp) => {
              const Icon = TEMP_ICONS[temp];
              return (
                <TabsTrigger key={temp} value={temp} className="gap-1.5 capitalize">
                  <Icon className="size-3.5" />
                  {temp}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        <ol className="flex flex-col gap-3">
          {steps.map((step, index) => (
            <li key={step.id} className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold capitalize">
                  Step {index + 1}: {step.step_type}
                </span>
                {step.requires_agent_approval ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
                    Approval required
                  </span>
                ) : null}
                <span className="text-xs text-muted-foreground">{formatDelay(step.delay_minutes)}</span>
              </div>

              {index > 0 ? (
                <label className="mb-2 flex flex-col gap-1 text-xs">
                  <span className="font-medium">Delay (minutes after previous step)</span>
                  <input
                    type="number"
                    min={0}
                    className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    value={step.delay_minutes}
                    onChange={(e) => updateStep(step.id, { delay_minutes: Number(e.target.value) || 0 })}
                  />
                </label>
              ) : null}

              {step.step_type === 'email' ? (
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="font-medium">Subject template</span>
                    <input
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                      value={step.subject_template || ''}
                      onChange={(e) => updateStep(step.id, { subject_template: e.target.value })}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="font-medium">Body template</span>
                    <textarea
                      rows={4}
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                      value={step.body_template || ''}
                      onChange={(e) => updateStep(step.id, { body_template: e.target.value })}
                    />
                  </label>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="font-medium">Task title</span>
                    <input
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                      value={step.task_title || ''}
                      onChange={(e) => updateStep(step.id, { task_title: e.target.value })}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs">
                    <span className="font-medium">Task notes</span>
                    <textarea
                      rows={2}
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                      value={step.task_description || ''}
                      onChange={(e) => updateStep(step.id, { task_description: e.target.value })}
                    />
                  </label>
                </div>
              )}
            </li>
          ))}
        </ol>

        <Button onClick={handleSave} disabled={saving} isLoading={saving} className="w-fit gap-1.5">
          <Save className="size-4" />
          Save {activeTemp} sequence
        </Button>
      </CardContent>
    </Card>
  );
}

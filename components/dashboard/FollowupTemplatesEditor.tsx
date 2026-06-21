'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Loader2, RotateCcw, Save } from 'lucide-react';
import Surface from '@/components/ui/Surface';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';
import {
  FOLLOWUP_MERGE_TAGS,
  FOLLOWUP_TEMPLATE_DEFINITIONS,
  getTemplateDraft,
  type FollowupSettings,
  type FollowupTemplateSlot,
} from '@/lib/followup-emails';

type TemplateDraft = {
  day: number;
  subject: string;
  body: string;
};

type FollowupTemplatesEditorProps = {
  settings: FollowupSettings | null | undefined;
  onSaved: () => void;
};

function buildDraftState(settings: FollowupSettings | null | undefined): Record<FollowupTemplateSlot, TemplateDraft> {
  return {
    1: getTemplateDraft(settings, 1),
    2: getTemplateDraft(settings, 2),
    3: getTemplateDraft(settings, 3),
  };
}

export default function FollowupTemplatesEditor({ settings, onSaved }: FollowupTemplatesEditorProps) {
  const toast = useToast();
  const [drafts, setDrafts] = useState<Record<FollowupTemplateSlot, TemplateDraft>>(() => buildDraftState(settings));
  const [expandedSlot, setExpandedSlot] = useState<FollowupTemplateSlot | null>(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDrafts(buildDraftState(settings));
  }, [settings]);

  const scheduleSummary = useMemo(() => {
    const days = [drafts[1].day, drafts[2].day, drafts[3].day].sort((a, b) => a - b);
    return `Emails send on day ${days[0]}, day ${days[1]}, and day ${days[2]} after capture`;
  }, [drafts]);

  const updateDraft = (slot: FollowupTemplateSlot, patch: Partial<TemplateDraft>) => {
    setDrafts((current) => ({
      ...current,
      [slot]: { ...current[slot], ...patch },
    }));
  };

  const resetSlot = (slot: FollowupTemplateSlot) => {
    const definition = FOLLOWUP_TEMPLATE_DEFINITIONS.find((item) => item.slot === slot);
    if (!definition) return;
    updateDraft(slot, {
      day: definition.defaultDay,
      subject: definition.defaultSubject,
      body: definition.defaultBody,
    });
    toast.info(`${definition.label} reset to default`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: FollowupSettings = {
        followup_email_1_day: drafts[1].day,
        followup_email_2_day: drafts[2].day,
        followup_email_3_day: drafts[3].day,
        followup_email_1_subject: drafts[1].subject,
        followup_email_1_body: drafts[1].body,
        followup_email_2_subject: drafts[2].subject,
        followup_email_2_body: drafts[2].body,
        followup_email_3_subject: drafts[3].subject,
        followup_email_3_body: drafts[3].body,
      };

      const res = await fetch('/api/agent-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.error || 'Could not save email templates');
        return;
      }
      toast.success('Follow-up emails saved');
      onSaved();
    } catch {
      toast.error('Could not save email templates');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Surface padding="md" className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Email templates & timing</h3>
        <p className="text-sm text-gray-500 mt-1">
          Customize what gets sent and when. Day 0 is the same day someone submits your form.
        </p>
        <p className="text-xs text-gray-500 mt-2">{scheduleSummary}</p>
      </div>

      <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
        <p className="text-xs text-gray-600">
          <span className="font-medium text-gray-700">Merge tags:</span>{' '}
          {FOLLOWUP_MERGE_TAGS.join(', ')}
        </p>
      </div>

      <div className="space-y-3">
        {FOLLOWUP_TEMPLATE_DEFINITIONS.map((definition) => {
          const draft = drafts[definition.slot];
          const isOpen = expandedSlot === definition.slot;

          return (
            <div key={definition.slot} className="rounded-xl border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedSlot(isOpen ? null : definition.slot)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-gray-50 transition-colors text-left"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{definition.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Send on day {draft.day}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 space-y-3 bg-white border-t border-gray-100">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Send on day</label>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={draft.day}
                      onChange={(e) => updateDraft(definition.slot, { day: Number(e.target.value) })}
                      className="w-28 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Subject</label>
                    <input
                      type="text"
                      value={draft.subject}
                      onChange={(e) => updateDraft(definition.slot, { subject: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Message</label>
                    <textarea
                      value={draft.body}
                      onChange={(e) => updateDraft(definition.slot, { body: e.target.value })}
                      rows={8}
                      className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-brand-500 resize-y"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => resetSlot(definition.slot)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset to default
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button onClick={handleSave} isLoading={saving} disabled={saving} className="w-full sm:w-auto">
        <Save className="w-4 h-4" />
        Save templates
      </Button>
    </Surface>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Eye, Loader2, RotateCcw, Save, Settings2 } from 'lucide-react';
import Surface from '@/components/ui/Surface';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/providers/ToastProvider';
import {
  FOLLOWUP_MERGE_TAGS,
  FOLLOWUP_TEMPLATE_DEFINITIONS,
  clampFollowupCheckinDay,
  clampFollowupNudgeDay,
  formatFollowupScheduleHuman,
  getDefaultFollowupSettingsPayload,
  getFollowupPreview,
  getTemplateDraft,
  hasCustomFollowupCopy,
  normalizeFollowupDays,
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

const TIMELINE_LABELS: Record<FollowupTemplateSlot, string> = {
  1: 'Welcome',
  2: 'Check-in',
  3: 'Final nudge',
};

function formatTimingLabel(slot: FollowupTemplateSlot, day: number): string {
  if (slot === 1 && day === 0) return 'Right when they submit';
  if (day === 1) return '1 day later';
  return `${day} days later`;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(0, 2);
}

function parseDayInput(value: string): number | null {
  const digits = digitsOnly(value);
  if (!digits) return null;
  return Number.parseInt(digits, 10);
}

export default function FollowupTemplatesEditor({ settings, onSaved }: FollowupTemplatesEditorProps) {
  const toast = useToast();
  const [timingDays, setTimingDays] = useState({ checkin: 2, nudge: 5 });
  const [checkinInput, setCheckinInput] = useState('2');
  const [nudgeInput, setNudgeInput] = useState('5');
  const [drafts, setDrafts] = useState<Record<FollowupTemplateSlot, TemplateDraft>>(() => buildDraftState(settings));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expandedSlot, setExpandedSlot] = useState<FollowupTemplateSlot | null>(null);
  const [previewSlot, setPreviewSlot] = useState<FollowupTemplateSlot | null>(null);
  const [savingTiming, setSavingTiming] = useState(false);
  const [savingAdvanced, setSavingAdvanced] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const days = normalizeFollowupDays(settings);
    setTimingDays({ checkin: days[2], nudge: days[3] });
    setCheckinInput(String(days[2]));
    setNudgeInput(String(days[3]));
    setDrafts(buildDraftState(settings));
  }, [settings]);

  useEffect(() => {
    if (hasCustomFollowupCopy(settings)) {
      setShowAdvanced(true);
    }
  }, [settings]);

  const scheduleDraftSettings = useMemo<FollowupSettings>(() => ({
    ...settings,
    followup_email_1_day: 0,
    followup_email_2_day: timingDays.checkin,
    followup_email_3_day: timingDays.nudge,
  }), [settings, timingDays]);

  const scheduleSummary = formatFollowupScheduleHuman(scheduleDraftSettings);
  const usingCustomCopy = hasCustomFollowupCopy(settings);

  const updateDraft = (slot: FollowupTemplateSlot, patch: Partial<TemplateDraft>) => {
    setDrafts((current) => ({
      ...current,
      [slot]: { ...current[slot], ...patch },
    }));
  };

  const savePayload = async (payload: FollowupSettings, successMessage: string, setLoading: (value: boolean) => void) => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.error || 'Could not save follow-up settings');
        return false;
      }
      toast.success(successMessage);
      onSaved();
      return true;
    } catch {
      toast.error('Could not save follow-up settings');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const commitTimingValues = () => {
    const checkin = clampFollowupCheckinDay(parseDayInput(checkinInput) ?? timingDays.checkin);
    const nudge = clampFollowupNudgeDay(parseDayInput(nudgeInput) ?? timingDays.nudge, checkin);
    setCheckinInput(String(checkin));
    setNudgeInput(String(nudge));
    setTimingDays({ checkin, nudge });
    return { checkin, nudge };
  };

  const handleSaveTiming = async () => {
    const { checkin, nudge } = commitTimingValues();
    await savePayload(
      {
        followup_email_1_day: 0,
        followup_email_2_day: checkin,
        followup_email_3_day: nudge,
      },
      'Follow-up schedule saved',
      setSavingTiming,
    );
  };

  const handleSaveAdvanced = async () => {
    const { checkin, nudge } = commitTimingValues();
    const matchesDefault = (slot: FollowupTemplateSlot, field: 'subject' | 'body') => {
      const definition = FOLLOWUP_TEMPLATE_DEFINITIONS.find((item) => item.slot === slot)!;
      const draft = drafts[slot];
      const value = field === 'subject' ? draft.subject.trim() : draft.body.trim();
      const defaultValue = field === 'subject' ? definition.defaultSubject.trim() : definition.defaultBody.trim();
      return value === defaultValue ? null : value;
    };

    await savePayload(
      {
        followup_email_1_day: 0,
        followup_email_2_day: checkin,
        followup_email_3_day: nudge,
        followup_email_1_subject: matchesDefault(1, 'subject'),
        followup_email_1_body: matchesDefault(1, 'body'),
        followup_email_2_subject: matchesDefault(2, 'subject'),
        followup_email_2_body: matchesDefault(2, 'body'),
        followup_email_3_subject: matchesDefault(3, 'subject'),
        followup_email_3_body: matchesDefault(3, 'body'),
      },
      'Custom emails saved',
      setSavingAdvanced,
    );
  };

  const handleRestoreDefaults = async () => {
    setResetting(true);
    try {
      const defaults = getDefaultFollowupSettingsPayload();
      const res = await fetch('/api/agent-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaults),
      });
      const result = await res.json();
      if (!result.success) {
        toast.error(result.error || 'Could not restore defaults');
        return;
      }
      setTimingDays({ checkin: 2, nudge: 5 });
      setCheckinInput('2');
      setNudgeInput('5');
      setDrafts(buildDraftState(null));
      setShowAdvanced(false);
      toast.success('Restored Realestic default emails');
      onSaved();
    } catch {
      toast.error('Could not restore defaults');
    } finally {
      setResetting(false);
    }
  };

  const resetSlot = (slot: FollowupTemplateSlot) => {
    const definition = FOLLOWUP_TEMPLATE_DEFINITIONS.find((item) => item.slot === slot);
    if (!definition) return;
    updateDraft(slot, {
      day: definition.defaultDay,
      subject: definition.defaultSubject,
      body: definition.defaultBody,
    });
    toast.info(`${definition.label} reset to default wording`);
  };

  const previewSettings = useMemo<FollowupSettings>(() => ({
    followup_email_1_day: 0,
    followup_email_2_day: timingDays.checkin,
    followup_email_3_day: timingDays.nudge,
    followup_email_1_subject: drafts[1].subject,
    followup_email_1_body: drafts[1].body,
    followup_email_2_subject: drafts[2].subject,
    followup_email_2_body: drafts[2].body,
    followup_email_3_subject: drafts[3].subject,
    followup_email_3_body: drafts[3].body,
  }), [drafts, timingDays]);

  const preview = previewSlot ? getFollowupPreview(previewSlot, previewSettings) : null;

  return (
    <>
      <Surface padding="md" className="space-y-5">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Follow-up schedule</h3>
          <p className="text-sm text-gray-500 mt-1">
            We wrote professional emails for you. Turn on auto follow-up above — no setup required.
          </p>
          {usingCustomCopy && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
              You&apos;re using custom email wording. Restore defaults anytime if you want the originals back.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {([1, 2, 3] as FollowupTemplateSlot[]).map((slot) => {
            const day = slot === 1 ? 0 : slot === 2 ? timingDays.checkin : timingDays.nudge;
            return (
              <div key={slot} className="flex items-center justify-between gap-3 px-4 py-3 bg-white">
                <div>
                  <p className="text-sm font-medium text-gray-900">{TIMELINE_LABELS[slot]}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatTimingLabel(slot, day)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewSlot(slot)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-brand-600 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
              </div>
            );
          })}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Check-in email</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 shrink-0">Send after</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={checkinInput}
                onChange={(e) => setCheckinInput(digitsOnly(e.target.value))}
                onBlur={() => {
                  const checkin = clampFollowupCheckinDay(parseDayInput(checkinInput) ?? timingDays.checkin);
                  const nudge = clampFollowupNudgeDay(parseDayInput(nudgeInput) ?? timingDays.nudge, checkin);
                  setCheckinInput(String(checkin));
                  setNudgeInput(String(nudge));
                  setTimingDays({ checkin, nudge });
                }}
                className="w-20 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-brand-500"
                aria-label="Check-in email days after lead capture"
              />
              <span className="text-sm text-gray-500">days</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Final nudge</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 shrink-0">Send after</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={nudgeInput}
                onChange={(e) => setNudgeInput(digitsOnly(e.target.value))}
                onBlur={() => {
                  const checkin = clampFollowupCheckinDay(parseDayInput(checkinInput) ?? timingDays.checkin);
                  const nudge = clampFollowupNudgeDay(parseDayInput(nudgeInput) ?? timingDays.nudge, checkin);
                  setCheckinInput(String(checkin));
                  setNudgeInput(String(nudge));
                  setTimingDays({ checkin, nudge });
                }}
                className="w-20 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-brand-500"
                aria-label="Final nudge days after lead capture"
              />
              <span className="text-sm text-gray-500">days</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Welcome sends right away. Check-in must be at least day 1, and the final nudge must be at least one day after that.
        </p>

        <p className="text-xs text-gray-500">
          Current schedule: {scheduleSummary}.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSaveTiming} isLoading={savingTiming} disabled={savingTiming} size="sm">
            <Save className="w-4 h-4" />
            Save schedule
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestoreDefaults}
            isLoading={resetting}
            disabled={resetting}
          >
            <RotateCcw className="w-4 h-4" />
            Restore Realestic defaults
          </Button>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced((current) => !current)}
            className="w-full flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Customize email wording</p>
                <p className="text-xs text-gray-500 mt-0.5">Optional — only if you want your own voice</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-4">
              <p className="text-xs text-gray-500 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                Stick to the defaults unless you know what you&apos;re doing. Use preview before saving, and restore defaults if anything looks off.
              </p>

              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                <p className="text-xs text-gray-600">
                  <span className="font-medium text-gray-700">Optional tags:</span>{' '}
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
                          <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[240px] sm:max-w-md">{draft.subject}</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 space-y-3 bg-white border-t border-gray-100">
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

                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => setPreviewSlot(definition.slot)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-brand-600 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => resetSlot(definition.slot)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Reset this email
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <Button onClick={handleSaveAdvanced} isLoading={savingAdvanced} disabled={savingAdvanced} size="sm">
                <Save className="w-4 h-4" />
                Save custom wording
              </Button>
            </div>
          )}
        </div>
      </Surface>

      <Modal
        isOpen={previewSlot !== null}
        onClose={() => setPreviewSlot(null)}
        title={preview ? `Preview · ${preview.label}` : 'Preview'}
        size="md"
      >
        {preview && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">
              Sample lead: Sarah Johnson · buying · Riverside
            </p>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Subject</p>
              <p className="text-sm font-medium text-gray-900">{preview.subject}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Message</p>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 border border-gray-200 rounded-xl p-4">
                {preview.body}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

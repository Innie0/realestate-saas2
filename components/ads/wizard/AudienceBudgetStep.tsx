'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import Input from '@/components/ui/Input';
import {
  AUDIENCE_PRESETS,
  CTA_OPTIONS,
  DURATION_OPTIONS,
  BUDGET_PRESETS_CENTS,
  MAX_DAILY_BUDGET_CENTS,
  MIN_DAILY_BUDGET_CENTS,
} from '@/lib/ads/promotion-options';
import type { AdDraft } from '@/lib/ads/ad-draft-types';
import clsx from 'clsx';

interface AudienceBudgetStepProps {
  draft: AdDraft;
  onChange: (patch: Partial<AdDraft>) => void;
}

export default function AudienceBudgetStep({ draft, onChange }: AudienceBudgetStepProps) {
  const [suggestionNote, setSuggestionNote] = useState<string | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const autoSuggested = useRef(false);

  const loadSuggestion = async () => {
    if (!draft.adType) return;
    setLoadingSuggestion(true);
    try {
      const res = await fetch('/api/ai/suggest-targeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adType: draft.adType,
          propertyDetails: draft.propertyDetails,
        }),
      });
      const json = await res.json();
      if (!json.success) return;
      const { audience, budget, note } = json.data;
      onChange({
        audience: {
          preset: audience.preset,
          radiusMiles: audience.radiusMiles,
          ageMin: audience.ageMin,
          ageMax: audience.ageMax,
          interests: audience.interests ?? draft.audience.interests,
        },
        budget: {
          dailyAmountCents: budget.dailyAmountCents,
          durationDays: budget.durationDays,
        },
      });
      setSuggestionNote(note);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  useEffect(() => {
    if (autoSuggested.current || !draft.adType) return;
    autoSuggested.current = true;
    void loadSuggestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.adType]);

  const dailyDollars = draft.budget.dailyAmountCents / 100;
  const total = dailyDollars * draft.budget.durationDays;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-label">Audience & budget</p>
        <button
          type="button"
          onClick={() => void loadSuggestion()}
          disabled={loadingSuggestion || !draft.adType}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
        >
          {loadingSuggestion ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          Suggest for me
        </button>
      </div>

      {suggestionNote && (
        <div className="flex items-start gap-2 rounded-lg border border-brand-100 bg-brand-50/50 px-3 py-2.5">
          <Sparkles className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-brand-900">{suggestionNote}</p>
        </div>
      )}

      <div>
        <p className="text-label mb-2">Who should see it?</p>
        <div className="grid gap-2 sm:grid-cols-3 mb-4">
          {AUDIENCE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() =>
                onChange({
                  audience: { ...draft.audience, preset: preset.id },
                })
              }
              className={clsx(
                'rounded-lg border px-3 py-2.5 text-left transition-colors duration-150',
                draft.audience.preset === preset.id
                  ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/20'
                  : 'border-gray-200 hover:border-gray-300 bg-[var(--surface)]'
              )}
            >
              <p className="text-[12.5px] font-medium text-gray-900">{preset.label}</p>
              <p className="text-[11px] text-gray-700 mt-0.5">{preset.description}</p>
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-[12px] font-medium text-gray-600 mb-1.5 block">
              Radius · {draft.audience.radiusMiles} mi
            </label>
            <input
              type="range"
              min={5}
              max={50}
              value={draft.audience.radiusMiles}
              onChange={(e) =>
                onChange({
                  audience: {
                    ...draft.audience,
                    radiusMiles: Number(e.target.value),
                  },
                })
              }
              className="w-full accent-brand-500"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-gray-600 mb-1.5 block">
              Age min · {draft.audience.ageMin}
            </label>
            <input
              type="range"
              min={18}
              max={65}
              value={draft.audience.ageMin}
              onChange={(e) =>
                onChange({
                  audience: {
                    ...draft.audience,
                    ageMin: Math.min(Number(e.target.value), draft.audience.ageMax),
                  },
                })
              }
              className="w-full accent-brand-500"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-gray-600 mb-1.5 block">
              Age max · {draft.audience.ageMax}
            </label>
            <input
              type="range"
              min={18}
              max={65}
              value={draft.audience.ageMax}
              onChange={(e) =>
                onChange({
                  audience: {
                    ...draft.audience,
                    ageMax: Math.max(Number(e.target.value), draft.audience.ageMin),
                  },
                })
              }
              className="w-full accent-brand-500"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 mt-3">
          <Input
            label="Radius (miles)"
            type="number"
            min={5}
            max={50}
            value={draft.audience.radiusMiles}
            onChange={(e) =>
              onChange({
                audience: {
                  ...draft.audience,
                  radiusMiles: Math.min(50, Math.max(5, Number(e.target.value) || 15)),
                },
              })
            }
          />
          <Input
            label="Age min"
            type="number"
            min={18}
            max={65}
            value={draft.audience.ageMin}
            onChange={(e) =>
              onChange({
                audience: { ...draft.audience, ageMin: Number(e.target.value) || 25 },
              })
            }
          />
          <Input
            label="Age max"
            type="number"
            min={18}
            max={65}
            value={draft.audience.ageMax}
            onChange={(e) =>
              onChange({
                audience: { ...draft.audience, ageMax: Number(e.target.value) || 65 },
              })
            }
          />
        </div>
      </div>

      <div>
        <p className="text-label mb-2">Budget & schedule</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {BUDGET_PRESETS_CENTS.map((cents) => (
            <button
              key={cents}
              type="button"
              onClick={() =>
                onChange({ budget: { ...draft.budget, dailyAmountCents: cents } })
              }
              className={clsx(
                'rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-colors',
                draft.budget.dailyAmountCents === cents
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              )}
            >
              ${cents / 100}/day
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-32">
            <Input
              label="Custom $/day"
              type="number"
              min={MIN_DAILY_BUDGET_CENTS / 100}
              max={MAX_DAILY_BUDGET_CENTS / 100}
              value={dailyDollars}
              onChange={(e) =>
                onChange({
                  budget: {
                    ...draft.budget,
                    dailyAmountCents: Math.round(Number(e.target.value) * 100) || 2000,
                  },
                })
              }
            />
          </div>
          <div className="flex flex-wrap gap-2 pb-0.5">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                type="button"
                onClick={() =>
                  onChange({ budget: { ...draft.budget, durationDays: opt.days } })
                }
                className={clsx(
                  'rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-colors',
                  draft.budget.durationDays === opt.days
                    ? 'border-brand-500 bg-brand-50 text-brand-800'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[12px] text-gray-700 mt-2">
          Estimated spend:{' '}
          <span className="font-medium text-gray-700 tabular-nums">
            ${total.toLocaleString('en-US')}
          </span>{' '}
          total
        </p>
      </div>

      <div>
        <p className="text-label mb-2">Button</p>
        <div className="flex flex-wrap gap-2">
          {CTA_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange({ cta: opt.id })}
              className={clsx(
                'rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-colors',
                draft.cta === opt.id
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

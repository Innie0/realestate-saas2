'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SQFT_PRESET_PCTS, type CmaSearchCriteria } from '@/lib/cma-search-criteria';
import type { SubjectProperty } from '@/lib/cma';

function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
        enabled ? 'bg-gray-900' : 'bg-gray-300',
      )}
    >
      <span
        className={cn(
          'inline-block size-3.5 rounded-full bg-white shadow transition-transform',
          enabled ? 'translate-x-[18px]' : 'translate-x-[3px]',
        )}
      />
      <span className="sr-only">{label}</span>
    </button>
  );
}

function Stepper({
  value,
  onChange,
  min = 0,
  max = 20,
  step = 1,
  disabled,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}) {
  const display = value ?? min;
  return (
    <div className={cn('flex items-center gap-1', disabled && 'opacity-50')}>
      <button
        type="button"
        disabled={disabled || display <= min}
        onClick={() => onChange(Math.max(min, display - step))}
        className="flex size-7 items-center justify-center rounded-md border border-gray-200 bg-[var(--surface)] text-gray-700 hover:bg-gray-50 disabled:opacity-40"
      >
        −
      </button>
      <span className="min-w-[2rem] text-center text-[13px] font-medium text-gray-900">
        {value ?? '—'}
      </span>
      <button
        type="button"
        disabled={disabled || display >= max}
        onClick={() => onChange(Math.min(max, display + step))}
        className="flex size-7 items-center justify-center rounded-md border border-gray-200 bg-[var(--surface)] text-gray-700 hover:bg-gray-50 disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

function CriteriaCard({
  title,
  subjectHint,
  enabled,
  onEnabledChange,
  children,
}: {
  title: string;
  subjectHint?: string;
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[10px] border border-gray-200 bg-[var(--surface)] p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-[12.5px] font-semibold text-gray-900">{title}</p>
          {subjectHint && (
            <p className="text-[11px] text-gray-500">Subject: {subjectHint}</p>
          )}
        </div>
        <Toggle enabled={enabled} onChange={onEnabledChange} label={`Include ${title} in search`} />
      </div>
      <div className={cn(!enabled && 'pointer-events-none opacity-45')}>{children}</div>
      <p className="mt-2 text-[10.5px] text-gray-500">
        {enabled ? 'Included in search' : 'Excluded from search'}
      </p>
    </div>
  );
}

export interface CmaAdvancedSearchParamsProps {
  subject: SubjectProperty;
  criteria: CmaSearchCriteria;
  onChange: (criteria: CmaSearchCriteria) => void;
  matchPreviewCount: number | null;
  matchPreviewLoading?: boolean;
  /** Breezy-style: beds/baths/year cards only, rest collapsed */
  breezyLayout?: boolean;
}

export default function CmaAdvancedSearchParams({
  subject,
  criteria,
  onChange,
  matchPreviewCount,
  matchPreviewLoading,
  breezyLayout = false,
}: CmaAdvancedSearchParamsProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const patch = (partial: Partial<CmaSearchCriteria>) => onChange({ ...criteria, ...partial });

  const bedsCard = (
    <CriteriaCard
      title="Bedrooms"
      subjectHint={subject.bedrooms != null ? String(subject.bedrooms) : undefined}
      enabled={criteria.bedsEnabled}
      onEnabledChange={(bedsEnabled) => patch({ bedsEnabled })}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] text-gray-500">Min</p>
          <Stepper
            value={criteria.bedsMin}
            onChange={(bedsMin) => patch({ bedsMin })}
            max={10}
            disabled={!criteria.bedsEnabled}
          />
        </div>
        <div>
          <p className="text-[10px] text-gray-500">Max</p>
          <Stepper
            value={criteria.bedsMax}
            onChange={(bedsMax) => patch({ bedsMax })}
            max={10}
            disabled={!criteria.bedsEnabled}
          />
        </div>
      </div>
    </CriteriaCard>
  );

  const bathsCard = (
    <CriteriaCard
      title="Bathrooms"
      subjectHint={subject.bathrooms != null ? String(subject.bathrooms) : undefined}
      enabled={criteria.bathsEnabled}
      onEnabledChange={(bathsEnabled) => patch({ bathsEnabled })}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] text-gray-500">Min</p>
          <Stepper
            value={criteria.bathsMin}
            onChange={(bathsMin) => patch({ bathsMin })}
            max={10}
            step={0.5}
            disabled={!criteria.bathsEnabled}
          />
        </div>
        <div>
          <p className="text-[10px] text-gray-500">Max</p>
          <Stepper
            value={criteria.bathsMax}
            onChange={(bathsMax) => patch({ bathsMax })}
            max={10}
            step={0.5}
            disabled={!criteria.bathsEnabled}
          />
        </div>
      </div>
    </CriteriaCard>
  );

  const yearBuiltCard = (
    <CriteriaCard
      title="Year built"
      subjectHint={subject.yearBuilt != null ? String(subject.yearBuilt) : undefined}
      enabled={criteria.yearBuiltEnabled}
      onEnabledChange={(yearBuiltEnabled) => patch({ yearBuiltEnabled })}
    >
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] text-gray-600">
          From
          <input
            type="number"
            value={criteria.yearBuiltMin ?? ''}
            onChange={(e) =>
              patch({
                yearBuiltMin: e.target.value === '' ? null : Number(e.target.value),
              })
            }
            className="mt-1 w-full rounded-[8px] border border-gray-200 px-2 py-1.5 text-[12px]"
          />
        </label>
        <label className="text-[11px] text-gray-600">
          To
          <input
            type="number"
            value={criteria.yearBuiltMax ?? ''}
            onChange={(e) =>
              patch({
                yearBuiltMax: e.target.value === '' ? null : Number(e.target.value),
              })
            }
            className="mt-1 w-full rounded-[8px] border border-gray-200 px-2 py-1.5 text-[12px]"
          />
        </label>
      </div>
    </CriteriaCard>
  );

  const extraCards = (
    <>
      <CriteriaCard
        title="Home sqft"
        subjectHint={
          subject.squareFootage ? `${subject.squareFootage.toLocaleString()} sqft` : undefined
        }
        enabled={criteria.sqftEnabled}
        onEnabledChange={(sqftEnabled) => patch({ sqftEnabled })}
      >
        <div className="mb-2 flex flex-wrap gap-1">
          {SQFT_PRESET_PCTS.map((pct) => (
            <button
              key={pct}
              type="button"
              disabled={!subject.squareFootage}
              onClick={() => {
                if (!subject.squareFootage) return;
                const factor = pct / 100;
                patch({
                  sqftEnabled: true,
                  sqftMin: Math.round((subject.squareFootage * (1 - factor)) / 10) * 10,
                  sqftMax: Math.round((subject.squareFootage * (1 + factor)) / 10) * 10,
                });
              }}
              className="rounded-full border border-gray-200 px-2 py-0.5 text-[10.5px] font-medium text-gray-700 hover:bg-gray-50"
            >
              ±{pct}%
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] text-gray-600">
            Min
            <input
              type="number"
              value={criteria.sqftMin ?? ''}
              onChange={(e) =>
                patch({ sqftMin: e.target.value === '' ? null : Number(e.target.value) })
              }
              className="mt-1 w-full rounded-[8px] border border-gray-200 px-2 py-1.5 text-[12px]"
            />
          </label>
          <label className="text-[11px] text-gray-600">
            Max
            <input
              type="number"
              value={criteria.sqftMax ?? ''}
              onChange={(e) =>
                patch({ sqftMax: e.target.value === '' ? null : Number(e.target.value) })
              }
              className="mt-1 w-full rounded-[8px] border border-gray-200 px-2 py-1.5 text-[12px]"
            />
          </label>
        </div>
      </CriteriaCard>

      <CriteriaCard
        title="Lot sqft"
        subjectHint={
          subject.lotSize ? `${subject.lotSize.toLocaleString()} sqft` : undefined
        }
        enabled={criteria.lotEnabled}
        onEnabledChange={(lotEnabled) => patch({ lotEnabled })}
      >
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[11px] text-gray-600">
            Min
            <input
              type="number"
              value={criteria.lotMin ?? ''}
              onChange={(e) =>
                patch({ lotMin: e.target.value === '' ? null : Number(e.target.value) })
              }
              className="mt-1 w-full rounded-[8px] border border-gray-200 px-2 py-1.5 text-[12px]"
            />
          </label>
          <label className="text-[11px] text-gray-600">
            Max
            <input
              type="number"
              value={criteria.lotMax ?? ''}
              onChange={(e) =>
                patch({ lotMax: e.target.value === '' ? null : Number(e.target.value) })
              }
              className="mt-1 w-full rounded-[8px] border border-gray-200 px-2 py-1.5 text-[12px]"
            />
          </label>
        </div>
      </CriteriaCard>
    </>
  );

  if (breezyLayout) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-gray-900 dark:text-foreground">Search Parameters</p>
          {matchPreviewLoading ? (
            <span className="text-[11px] text-gray-500">Counting…</span>
          ) : matchPreviewCount !== null ? (
            <span className="text-[11px] font-medium text-gray-600">
              {matchPreviewCount} match{matchPreviewCount !== 1 ? 'es' : ''}
            </span>
          ) : null}
        </div>
        {bedsCard}
        {bathsCard}
        {yearBuiltCard}
        <button
          type="button"
          onClick={() => setMoreOpen((v) => !v)}
          className="text-[12.5px] font-medium text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline dark:text-muted-foreground"
        >
          {moreOpen ? 'Hide extra filters' : 'More filters (sqft, lot)'}
        </button>
        {moreOpen && <div className="space-y-3">{extraCards}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-gray-900">Comp filters</p>
        {matchPreviewLoading ? (
          <span className="text-[11px] text-gray-500">Counting…</span>
        ) : matchPreviewCount !== null ? (
          <span className="text-[11px] font-medium text-gray-700">
            {matchPreviewCount} sale{matchPreviewCount !== 1 ? 's' : ''} match
          </span>
        ) : null}
      </div>

      {extraCards}
      {bedsCard}
      {bathsCard}
      {yearBuiltCard}
    </div>
  );
}

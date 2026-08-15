'use client';

import { useState } from 'react';
import { Bed, Bath, Ruler, Calendar, Loader2, RefreshCw, Info, Sparkles, Pencil, LandPlot } from 'lucide-react';
import Select from '@/components/ui/Select';
import { CONDITION_OPTIONS, type ConditionLevel, type SubjectProperty } from '@/lib/cma';
import type { SubjectEnrichmentMeta } from '@/components/property-research/CmaPanel';

const inputClass =
  'w-full bg-gray-50 border border-gray-200 rounded-[10px] px-3 py-2.5 text-gray-900 text-[13px] placeholder-gray-450 focus:outline-none focus:border-gray-400';

function enrichmentLabel(source: SubjectEnrichmentMeta[keyof SubjectEnrichmentMeta] | undefined) {
  switch (source) {
    case 'county':
      return 'County records';
    case 'mls':
      return 'MLS listing';
    case 'heuristic':
      return 'Estimated from price & size';
    case 'ai':
      return 'AI from listing remarks';
    default:
      return null;
  }
}

function AutoDetectHint({ source }: { source: SubjectEnrichmentMeta[keyof SubjectEnrichmentMeta] | undefined }) {
  const label = enrichmentLabel(source);
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10.5px] text-gray-600 mt-0.5">
      <Sparkles className="w-3 h-3" />
      Auto: {label}
    </span>
  );
}

function stat(value: string | number | null | undefined, suffix = '') {
  if (value === null || value === undefined || value === '') return '—';
  return `${value}${suffix}`;
}

export interface CmaSubjectSummaryProps {
  address: string;
  subject: SubjectProperty;
  subjectEnrichment: SubjectEnrichmentMeta | null;
  manualFields: Set<string>;
  prefilling: boolean;
  canPrefill: boolean;
  onPrefill: () => void;
  onUpdateSubject: <K extends keyof SubjectProperty>(key: K, value: SubjectProperty[K]) => void;
}

export default function CmaSubjectSummary({
  address,
  subject,
  subjectEnrichment,
  manualFields,
  prefilling,
  canPrefill,
  onPrefill,
  onUpdateSubject,
}: CmaSubjectSummaryProps) {
  const [editing, setEditing] = useState(false);

  return (
    <div data-tour="ma-subject" className="rounded-xl border border-gray-200/80 bg-gray-100/80 p-4 space-y-3 dark:border-border dark:bg-muted/40">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-gray-600 dark:text-muted-foreground">Subject property</p>
          <p className="mt-1 text-[15px] font-semibold leading-snug text-gray-900 break-words dark:text-foreground">{address}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1 rounded-[8px] border border-gray-200 bg-[var(--surface)] px-2.5 py-1.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Pencil className="size-3.5" />
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      {!editing && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-gray-700 dark:text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Bed className="size-4 text-gray-500" />
            {stat(subject.bedrooms)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bath className="size-4 text-gray-500" />
            {stat(subject.bathrooms)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Ruler className="size-4 text-gray-500" />
            {subject.squareFootage ? `${subject.squareFootage.toLocaleString()} ft²` : '—'}
          </span>
          {subject.lotSize ? (
            <span className="inline-flex items-center gap-1.5">
              <LandPlot className="size-4 text-gray-500" />
              {subject.lotSize.toLocaleString()} ft²
            </span>
          ) : null}
          {subject.yearBuilt ? (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-4 text-gray-500" />
              {subject.yearBuilt}
            </span>
          ) : null}
        </div>
      )}

      {editing && (
        <div className="space-y-3 border-t border-gray-150 pt-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onPrefill}
              disabled={prefilling || !canPrefill}
              className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
            >
              {prefilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Reload from county
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[12px] text-gray-600 mb-1">Beds</label>
              <input
                type="number"
                min={0}
                max={20}
                value={subject.bedrooms ?? ''}
                onChange={(e) =>
                  onUpdateSubject('bedrooms', e.target.value ? Number(e.target.value) : null)
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[12px] text-gray-600 mb-1">Baths</label>
              <input
                type="number"
                min={0}
                max={20}
                step={0.5}
                value={subject.bathrooms ?? ''}
                onChange={(e) =>
                  onUpdateSubject('bathrooms', e.target.value ? Number(e.target.value) : null)
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[12px] text-gray-600 mb-1">Sq Ft</label>
              <input
                type="number"
                min={0}
                value={subject.squareFootage ?? ''}
                onChange={(e) =>
                  onUpdateSubject('squareFootage', e.target.value ? Number(e.target.value) : null)
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[12px] text-gray-600 mb-1">Year Built</label>
              <input
                type="number"
                min={1800}
                max={2030}
                value={subject.yearBuilt ?? ''}
                onChange={(e) =>
                  onUpdateSubject('yearBuilt', e.target.value ? Number(e.target.value) : null)
                }
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="block text-[12px] text-gray-600 mb-1">Condition</label>
              <Select
                value={subject.condition}
                onChange={(value) => onUpdateSubject('condition', value as ConditionLevel)}
                triggerClassName={inputClass}
                options={CONDITION_OPTIONS.map((c) => ({ value: c.value, label: c.label }))}
              />
              {!manualFields.has('condition') && (
                <AutoDetectHint source={subjectEnrichment?.condition} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[12px] text-gray-600 mb-1">Garage</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={subject.garageSpaces}
                  onChange={(e) => onUpdateSubject('garageSpaces', Number(e.target.value) || 0)}
                  className={inputClass}
                />
                {!manualFields.has('garageSpaces') && (
                  <AutoDetectHint source={subjectEnrichment?.garageSpaces} />
                )}
              </div>
              <div className="flex flex-col justify-end pb-1">
                <label className="flex items-center gap-2 text-[12.5px] text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subject.hasPool}
                    onChange={(e) => onUpdateSubject('hasPool', e.target.checked)}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  Has pool
                </label>
                {!manualFields.has('hasPool') && (
                  <AutoDetectHint source={subjectEnrichment?.hasPool} />
                )}
              </div>
            </div>
          </div>
          <p className="text-[11.5px] text-gray-600 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            Verify pool, garage, and condition before sharing with a client.
          </p>
        </div>
      )}
    </div>
  );
}

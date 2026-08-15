'use client';

import { cn } from '@/lib/utils';

const RADIUS_OPTIONS = [0.25, 0.5, 0.75, 1, 2] as const;

/** Sold-within options in months; stored as years for the API. */
const SOLD_WITHIN_OPTIONS = [
  { months: 6, years: 0.5 },
  { months: 12, years: 1 },
  { months: 18, years: 1.5 },
  { months: 24, years: 2 },
] as const;

const PROPERTY_TYPE_CHIPS = [
  { value: '', label: 'Auto' },
  { value: 'Single Family', label: 'SFR' },
  { value: 'Condo', label: 'Condo' },
  { value: 'Townhouse', label: 'Townhouse' },
  { value: 'Multi-Family', label: 'Multi' },
] as const;

function ParamPill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors',
        selected
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-200 bg-[var(--surface)] text-gray-700 hover:border-gray-300 hover:bg-gray-50',
      )}
    >
      {children}
    </button>
  );
}

function propertyTypeLabel(propertyType: string) {
  return PROPERTY_TYPE_CHIPS.find((c) => c.value === propertyType)?.label ?? 'Auto';
}

export function formatSearchParamsSummary(
  radius: number,
  yearsBack: number,
  propertyType: string,
): string {
  return `${radius} mi · ${Math.round(yearsBack * 12)} mo · ${propertyTypeLabel(propertyType)}`;
}

export interface CmaSearchParamsProps {
  radius: number;
  yearsBack: number;
  propertyType: string;
  includeActiveListings: boolean;
  onRadiusChange: (radius: number) => void;
  onYearsBackChange: (years: number) => void;
  onPropertyTypeChange: (type: string) => void;
  onIncludeActiveListingsChange: (value: boolean) => void;
  /** When true, show one-line summary with Edit to expand */
  collapsed?: boolean;
  onExpand?: () => void;
  /** Compact rows for Breezy-style left sidebar */
  breezyLayout?: boolean;
}

export default function CmaSearchParams({
  radius,
  yearsBack,
  propertyType,
  includeActiveListings,
  onRadiusChange,
  onYearsBackChange,
  onPropertyTypeChange,
  onIncludeActiveListingsChange,
  collapsed = false,
  onExpand,
  breezyLayout = false,
}: CmaSearchParamsProps) {
  if (collapsed) {
    return (
      <div className="flex items-start justify-between gap-2 rounded-[10px] border border-gray-150 bg-[var(--surface)] px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[11px] font-mono uppercase tracking-[0.06em] text-gray-600">Search parameters</p>
          <p className="mt-0.5 text-[12.5px] text-gray-800">
            {formatSearchParamsSummary(radius, yearsBack, propertyType)}
          </p>
        </div>
        {onExpand && (
          <button
            type="button"
            onClick={onExpand}
            className="shrink-0 text-[12px] font-medium text-brand-600 hover:text-brand-700"
          >
            Edit
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={breezyLayout ? 'space-y-3 rounded-xl border border-gray-200/80 bg-[var(--surface)] p-3 dark:border-border' : 'space-y-4'}>
      {!breezyLayout && <p className="text-[13px] font-semibold text-gray-900">Search parameters</p>}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12.5px] text-gray-600">Radius</span>
          <span className="text-[12.5px] font-medium text-gray-900">{radius} mi</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RADIUS_OPTIONS.map((value) => (
            <ParamPill key={value} selected={radius === value} onClick={() => onRadiusChange(value)}>
              {value}
            </ParamPill>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12.5px] text-gray-600">Sold within</span>
          <span className="text-[12.5px] font-medium text-gray-900">
            {Math.round(yearsBack * 12)} months
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SOLD_WITHIN_OPTIONS.map(({ months, years }) => (
            <ParamPill
              key={months}
              selected={yearsBack === years}
              onClick={() => onYearsBackChange(years)}
            >
              {months}
            </ParamPill>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-[12.5px] text-gray-600">Property type</span>
        <div className="flex flex-wrap gap-1.5">
          {PROPERTY_TYPE_CHIPS.map(({ value, label }) => (
            <ParamPill
              key={value || 'auto'}
              selected={propertyType === value}
              onClick={() => onPropertyTypeChange(value)}
            >
              {label}
            </ParamPill>
          ))}
        </div>
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[10px] border border-gray-200 bg-[var(--surface)] px-3 py-2.5">
        <div>
          <p className="text-[12.5px] font-medium text-gray-900">Include active listings</p>
          <p className="text-[11px] text-gray-500">Use nearby list prices as market comps (Breezy-style)</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={includeActiveListings}
          onClick={() => onIncludeActiveListingsChange(!includeActiveListings)}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
            includeActiveListings ? 'bg-gray-900' : 'bg-gray-300',
          )}
        >
          <span
            className={cn(
              'inline-block size-3.5 rounded-full bg-white shadow transition-transform',
              includeActiveListings ? 'translate-x-[18px]' : 'translate-x-[3px]',
            )}
          />
        </button>
      </label>
    </div>
  );
}

export const CMA_DEFAULT_RADIUS = 0.5;
export const CMA_DEFAULT_YEARS_BACK = 1;

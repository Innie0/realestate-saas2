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

export interface CmaSearchParamsProps {
  radius: number;
  yearsBack: number;
  propertyType: string;
  onRadiusChange: (radius: number) => void;
  onYearsBackChange: (years: number) => void;
  onPropertyTypeChange: (type: string) => void;
}

export default function CmaSearchParams({
  radius,
  yearsBack,
  propertyType,
  onRadiusChange,
  onYearsBackChange,
  onPropertyTypeChange,
}: CmaSearchParamsProps) {
  return (
    <div className="space-y-4">
      <p className="text-[13px] font-semibold text-gray-900">Search parameters</p>

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
    </div>
  );
}

export const CMA_DEFAULT_RADIUS = 0.5;
export const CMA_DEFAULT_YEARS_BACK = 1;

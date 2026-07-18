'use client';

import clsx from 'clsx';
import { AD_TYPE_OPTIONS } from '@/lib/ads/ad-type-config';
import type { AdType } from '@/lib/ads/ad-draft-types';

interface AdTypeSelectorProps {
  value: AdType | null;
  onChange: (type: AdType) => void;
}

export default function AdTypeSelector({ value, onChange }: AdTypeSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {AD_TYPE_OPTIONS.map((option) => {
        const Icon = option.icon;
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={clsx(
              'flex items-start gap-3 rounded-[10px] border p-4 text-left transition-colors duration-150',
              selected
                ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500/20'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50'
            )}
          >
            <div
              className={clsx(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                selected ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600'
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-gray-900">{option.label}</p>
              <p className="text-caption text-gray-700 mt-0.5">{option.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

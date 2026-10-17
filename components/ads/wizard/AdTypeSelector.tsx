'use client';

import clsx from 'clsx';
import { AD_TYPE_OPTIONS, PLATFORM_AVAILABLE, PLATFORM_NAMES } from '@/lib/ads/ad-type-config';
import type { AdType } from '@/lib/ads/ad-draft-types';
import type { AdPlatform } from '@/lib/ads/types';

interface AdTypeSelectorProps {
  value: AdType | null;
  onChange: (type: AdType) => void;
  /** Platforms with a connected, ready ad account */
  readyPlatforms: AdPlatform[];
}

export default function AdTypeSelector({ value, onChange, readyPlatforms }: AdTypeSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {AD_TYPE_OPTIONS.map((option) => {
        const Icon = option.icon;
        const selected = value === option.id;
        const canPublishNow = option.platforms.some((p) => readyPlatforms.includes(p));
        const comingSoon = !option.platforms.some((p) => PLATFORM_AVAILABLE[p]);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            disabled={comingSoon}
            className={clsx(
              'flex items-start gap-3 rounded-[10px] border p-4 text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60',
              selected
                ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500/20'
                : 'border-gray-200 bg-[var(--surface)] hover:border-gray-300 hover:bg-gray-50/50'
            )}
          >
            <div
              className={clsx(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                selected ? 'bg-zinc-700 text-white' : 'bg-gray-100 text-gray-600'
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-[13px] font-semibold text-gray-900">{option.label}</p>
                {option.recommended && (
                  <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                    Recommended
                  </span>
                )}
              </div>
              <p className="text-caption text-gray-700 mt-0.5">{option.description}</p>
              <p className="mt-1.5 text-[11px] text-gray-600">
                {option.goal} ·{' '}
                {option.platforms
                  .filter((p) => PLATFORM_AVAILABLE[p] || comingSoon)
                  .map((p) => PLATFORM_NAMES[p])
                  .join(' + ')}
              </p>
              {comingSoon ? (
                <p className="mt-1 text-[11px] text-gray-600">Coming soon</p>
              ) : !canPublishNow && (
                <p className="mt-1 text-[11px] text-amber-700">
                  Available once{' '}
                  {option.platforms
                    .filter((p) => PLATFORM_AVAILABLE[p])
                    .map((p) => PLATFORM_NAMES[p])
                    .join(' or ')}{' '}
                  is connected
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

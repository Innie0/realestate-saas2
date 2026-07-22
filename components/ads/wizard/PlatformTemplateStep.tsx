'use client';

import clsx from 'clsx';
import { AD_TEMPLATES, type AdDraft } from '@/lib/ads/ad-draft-types';
import type { AdPlatform } from '@/lib/ads/types';

interface PlatformTemplateStepProps {
  draft: AdDraft;
  onChange: (patch: Partial<AdDraft>) => void;
  metaConnected: boolean;
  metaReady: boolean;
  googleConnected: boolean;
  googleReady: boolean;
}

export default function PlatformTemplateStep({
  draft,
  onChange,
  metaConnected,
  metaReady,
  googleConnected,
  googleReady,
}: PlatformTemplateStepProps) {
  const togglePlatform = (platform: AdPlatform) => {
    const has = draft.platforms.includes(platform);
    if (has && draft.platforms.length === 1) return;
    onChange({
      platforms: has
        ? draft.platforms.filter((p) => p !== platform)
        : [...draft.platforms, platform],
    });
  };

  const metaHint = metaReady
    ? 'Facebook & Instagram'
    : metaConnected
      ? 'Finish ad account setup'
      : 'Connect to publish';

  const googleHint = googleReady
    ? 'Search & display'
    : googleConnected
      ? 'No ads account yet'
      : 'Coming soon';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-label mb-2">Platforms</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => togglePlatform('meta')}
            className={clsx(
              'rounded-lg border px-4 py-2.5 text-[13px] font-medium transition-colors',
              draft.platforms.includes('meta')
                ? 'border-brand-400 bg-brand-50 text-gray-900'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            )}
          >
            Meta · Facebook & Instagram
            <span className="block text-[10px] font-normal text-gray-700 mt-0.5">{metaHint}</span>
          </button>
          <button
            type="button"
            onClick={() => togglePlatform('google')}
            className={clsx(
              'rounded-lg border px-4 py-2.5 text-[13px] font-medium transition-colors',
              draft.platforms.includes('google')
                ? 'border-blue-500 bg-blue-50 text-blue-800'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            )}
          >
            Google Ads
            <span className="block text-[10px] font-normal text-gray-700 mt-0.5">{googleHint}</span>
          </button>
        </div>
      </div>

      <div>
        <p className="text-label mb-2">Ad style</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {AD_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onChange({ templateId: template.id })}
              className={clsx(
                'rounded-lg border px-3 py-3 text-left transition-colors duration-150',
                draft.templateId === template.id
                  ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-500/20'
                  : 'border-gray-200 hover:border-gray-300 bg-[var(--surface)]'
              )}
            >
              <p className="text-[13px] font-semibold text-gray-900">{template.label}</p>
              <p className="text-caption text-gray-700 mt-0.5">{template.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

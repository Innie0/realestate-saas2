'use client';

import clsx from 'clsx';
import { getCtaLabel } from '@/lib/ads/promotion-options';
import { SITE_DOMAIN } from '@/lib/site-config';
import type { AdCtaType } from '@/lib/ads/promotion-options';

interface GooglePreviewCardProps {
  /** Every headline Google may show; it picks up to three at a time */
  headlines: string[];
  descriptions: string[];
  displayUrl?: string;
  className?: string;
}

export default function GooglePreviewCard({
  headlines,
  descriptions,
  displayUrl = SITE_DOMAIN,
  className,
}: GooglePreviewCardProps) {
  const shownHeadline = headlines.slice(0, 3).join(' | ');
  const shownDescription = descriptions.slice(0, 2).join(' ');
  const moreHeadlines = headlines.slice(3);

  return (
    <div className={clsx('theme-light rounded-lg border border-gray-200 bg-[var(--surface)] p-4 shadow-sm', className)}>
      <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-2">Google · Search ad</p>
      <p className="text-[11px] text-emerald-700">Ad · {displayUrl}</p>
      <p className="text-[15px] font-medium text-[#1a0dab] mt-0.5 leading-snug">
        {shownHeadline || 'Your headlines appear here'}
      </p>
      <p className="text-[13px] text-gray-700 mt-1 leading-snug">
        {shownDescription || 'Your message appears here.'}
      </p>
      {moreHeadlines.length > 0 && (
        <div className="mt-3 border-t border-gray-150 pt-2.5">
          <p className="text-[11px] text-gray-600">Google also rotates these headlines:</p>
          <p className="mt-1 text-[12px] text-gray-700 leading-relaxed">{moreHeadlines.join(' · ')}</p>
        </div>
      )}
    </div>
  );
}

export function googleCtaLabel(_cta: AdCtaType): string {
  return getCtaLabel(_cta);
}

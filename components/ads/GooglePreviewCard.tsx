'use client';

import clsx from 'clsx';
import { getCtaLabel } from '@/lib/ads/promotion-options';
import { SITE_DOMAIN } from '@/lib/site-config';
import type { AdCtaType } from '@/lib/ads/promotion-options';

interface GooglePreviewCardProps {
  headline: string;
  description: string;
  displayUrl?: string;
  className?: string;
}

export default function GooglePreviewCard({
  headline,
  description,
  displayUrl = `${SITE_DOMAIN}/lead`,
  className,
}: GooglePreviewCardProps) {
  return (
    <div className={clsx('theme-light rounded-lg border border-gray-200 bg-white p-4 shadow-sm', className)}>
      <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-2">Google · Search ad</p>
      <p className="text-[11px] text-emerald-700">Ad · {displayUrl}</p>
      <p className="text-[15px] font-medium text-[#1a0dab] mt-0.5 leading-snug line-clamp-2">
        {headline || 'Your headline appears here'}
      </p>
      <p className="text-[13px] text-gray-700 mt-1 leading-snug line-clamp-2">
        {description || 'Description line for your listing or offer.'}
      </p>
    </div>
  );
}

export function googleCtaLabel(_cta: AdCtaType): string {
  return getCtaLabel(_cta);
}

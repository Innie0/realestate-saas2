'use client';

import { Card } from '@/components/ui/Card';
import { ExternalLink, Loader2 } from 'lucide-react';
import StaggerList, { StaggerItem } from '@/components/motion/StaggerList';
import { formatListingAddress, normalizeProjectImages } from '@/lib/listing-utils';
import type { AdPromotion } from '@/lib/ads/types';
import clsx from 'clsx';
import Image from 'next/image';

interface ActivePromotionsPanelProps {
  promotions: AdPromotion[];
  loading?: boolean;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: { label: 'Live', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending: { label: 'Starting…', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  failed: { label: 'Failed', className: 'bg-red-50 text-red-700 border-red-200' },
  paused: { label: 'Paused', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  ended: { label: 'Ended', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function formatDailyBudget(cents: number): string {
  return `$${(cents / 100).toFixed(0)}/day`;
}

export default function ActivePromotionsPanel({ promotions, loading }: ActivePromotionsPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-caption text-gray-700 py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your ads…
      </div>
    );
  }

  if (promotions.length === 0) {
    return null;
  }

  return (
    <section>
      <p className="text-label mb-3">Your listing ads</p>
      <StaggerList className="space-y-3">
        {promotions.map((promo) => {
          const project = promo.projects && !Array.isArray(promo.projects) ? promo.projects : null;
          const info = project?.property_info || {};
          const address = project
            ? formatListingAddress(info, project.title)
            : promo.headline || 'Listing ad';
          const thumb = project ? normalizeProjectImages(project.images)[0] : null;
          const status = STATUS_LABELS[promo.status] ?? STATUS_LABELS.ended;

          return (
            <StaggerItem key={promo.id}>
              <Card className="p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    {thumb ? (
                      <Image src={thumb} alt="" fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] text-gray-400">
                        Ad
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[13px] font-semibold text-gray-900 truncate">{address}</h3>
                      <span
                        className={clsx(
                          'inline-flex rounded-full border px-2 py-0.5 text-[10.5px] font-medium',
                          status.className
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-caption text-gray-700 mt-1">
                      {formatDailyBudget(promo.daily_budget_cents)} · {promo.duration_days} days · Meta
                    </p>
                    {promo.status === 'failed' && promo.error_message && (
                      <p className="text-[12px] text-red-600 mt-2">{promo.error_message}</p>
                    )}
                    {promo.landing_url && (
                      <a
                        href={promo.landing_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-600 hover:text-brand-700 mt-2"
                      >
                        View landing page
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerList>
    </section>
  );
}

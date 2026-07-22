'use client';

import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getAdTypeLabel } from '@/lib/ads/ad-type-config';
import type { AdPerformanceSummary } from '@/lib/ads/performance-types';
import clsx from 'clsx';

interface AdDetailViewProps {
  ad: AdPerformanceSummary | null;
  onOptimize?: () => void;
  onClose?: () => void;
}

function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export default function AdDetailView({ ad, onOptimize, onClose }: AdDetailViewProps) {
  if (!ad) return null;

  const label = ad.projectAddress || ad.headline || ad.projectTitle || 'Ad';
  const maxImpressions = Math.max(1, ...ad.daily.map((d) => d.impressions));

  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-label">Ad detail</p>
          <h3 className="text-[15px] font-semibold text-gray-900 mt-0.5">{label}</h3>
          <p className="text-caption text-gray-700 mt-1">
            {ad.adType ? getAdTypeLabel(ad.adType) : 'Ad'} · {ad.platform} · {ad.status}
          </p>
        </div>
        <div className="flex gap-2">
          {onOptimize && (
            <Button size="sm" variant="outline" onClick={onOptimize}>
              Optimize this ad
            </Button>
          )}
          {onClose && (
            <Button size="sm" variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[13px]">
        {[
          ['Impressions', ad.impressions.toLocaleString()],
          ['CTR', `${ad.ctr.toFixed(2)}%`],
          ['Spend', formatMoney(ad.spendCents)],
          ['Leads', String(ad.leads)],
          ['Cost / lead', ad.costPerLead != null ? formatMoney(ad.costPerLead) : '—'],
          ['Avg frequency', ad.avgFrequency != null ? ad.avgFrequency.toFixed(1) : '—'],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-gray-700 text-[11px]">{k}</dt>
            <dd className="font-medium text-gray-900 tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      {ad.daily.length > 0 && (
        <div>
          <p className="text-label mb-2">Daily timeline</p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {ad.daily.map((day) => (
              <div key={day.date} className="flex items-center gap-2 text-[12px]">
                <span className="w-20 shrink-0 text-gray-700 tabular-nums">{day.date}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-brand-500/70 rounded-full"
                    style={{ width: `${(day.impressions / maxImpressions) * 100}%` }}
                  />
                </div>
                <span className="w-16 text-right tabular-nums text-gray-600">
                  {day.clicks} clk
                </span>
                <span className="w-14 text-right tabular-nums text-gray-700 hidden sm:inline">
                  {day.frequency != null ? `${Number(day.frequency).toFixed(1)}×` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ad.daily.length === 0 && (
        <p className={clsx('text-[12.5px] text-gray-700')}>
          Daily metrics sync overnight after your ad runs. Check back tomorrow or tap Refresh
          insights.
        </p>
      )}
    </Card>
  );
}

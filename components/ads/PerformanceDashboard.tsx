'use client';

import { Card } from '@/components/ui/Card';
import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AD_TYPE_OPTIONS } from '@/lib/ads/ad-type-config';
import type { PerformanceDashboardData } from '@/lib/ads/performance-types';
import clsx from 'clsx';

interface PerformanceDashboardProps {
  data: PerformanceDashboardData | null;
  loading?: boolean;
  onSelectAd?: (promotionId: string) => void;
  selectedAdId?: string | null;
  onFilterChange?: (filters: { adType: string; days: number }) => void;
}

const DATE_RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];

function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export default function PerformanceDashboard({
  data,
  loading,
  onSelectAd,
  selectedAdId,
  onFilterChange,
}: PerformanceDashboardProps) {
  const [adType, setAdType] = useState('');
  const [days, setDays] = useState(30);

  const filteredAds = useMemo(() => {
    if (!data) return [];
    return data.ads.filter((a) => !adType || a.adType === adType);
  }, [data, adType]);

  const applyFilters = (nextType: string, nextDays: number) => {
    setAdType(nextType);
    setDays(nextDays);
    onFilterChange?.({ adType: nextType, days: nextDays });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-caption text-gray-700 py-6">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading performance…
      </div>
    );
  }

  if (!data) return null;

  const totals = data.totals;
  const hasAds = data.ads.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {DATE_RANGES.map((r) => (
          <button
            key={r.days}
            type="button"
            onClick={() => applyFilters(adType, r.days)}
            className={clsx(
              'rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors',
              days === r.days
                ? 'border-brand-500 bg-brand-50 text-brand-800'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            )}
          >
            {r.label}
          </button>
        ))}
        <select
          value={adType}
          onChange={(e) => applyFilters(e.target.value, days)}
          className="rounded-lg border border-gray-200 bg-[var(--surface)] px-3 py-1.5 text-[12px] text-gray-700"
        >
          <option value="">All ad types</option>
          {AD_TYPE_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { label: 'Impressions', value: totals.impressions.toLocaleString() },
          { label: 'Clicks', value: totals.clicks.toLocaleString() },
          { label: 'CTR', value: `${totals.ctr.toFixed(2)}%` },
          { label: 'Spend', value: formatMoney(totals.spendCents) },
          { label: 'Leads', value: totals.leads.toLocaleString() },
          {
            label: 'Cost / lead',
            value: totals.costPerLead != null ? formatMoney(totals.costPerLead) : '—',
          },
        ].map((stat) => (
          <Card key={stat.label} className="p-5 sm:p-6 text-center sm:text-left">
            <p className="text-[10.5px] font-mono uppercase tracking-wide text-gray-600">
              {stat.label}
            </p>
            <p className="text-[15px] font-semibold text-gray-900 tabular-nums mt-0.5">
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      {!hasAds ? (
        <Card className="p-5 sm:p-6">
          <p className="text-[13px] text-gray-600">
            No published ads yet. Create and launch an ad to start tracking performance here.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-[13px]">
            <thead className="bg-gray-50 text-left text-[11px] font-mono uppercase tracking-wide text-gray-700">
              <tr>
                <th className="px-3 py-2.5 font-medium">Ad</th>
                <th className="px-3 py-2.5 font-medium">Impr.</th>
                <th className="px-3 py-2.5 font-medium">CTR</th>
                <th className="px-3 py-2.5 font-medium">Spend</th>
                <th className="px-3 py-2.5 font-medium">Leads</th>
                <th className="px-3 py-2.5 font-medium">CPL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-[var(--surface)]">
              {filteredAds.map((ad) => {
                const label =
                  ad.projectAddress || ad.headline || ad.projectTitle || 'Ad';
                const selected = selectedAdId === ad.promotionId;
                return (
                  <tr
                    key={ad.promotionId}
                    onClick={() => onSelectAd?.(ad.promotionId)}
                    className={clsx(
                      onSelectAd && 'cursor-pointer hover:bg-gray-50/80',
                      selected && 'bg-brand-50/40'
                    )}
                  >
                    <td className="px-3 py-2.5 font-medium text-gray-900 max-w-[200px] truncate">
                      {label}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-gray-700">
                      {ad.impressions.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-gray-700">
                      {ad.ctr.toFixed(2)}%
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-gray-700">
                      {formatMoney(ad.spendCents)}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-gray-700">{ad.leads}</td>
                    <td className="px-3 py-2.5 tabular-nums text-gray-700">
                      {ad.costPerLead != null ? formatMoney(ad.costPerLead) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

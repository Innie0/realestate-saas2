'use client';

import { Card } from '@/components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import type { PerformanceDashboardData } from '@/lib/ads/performance-types';
import clsx from 'clsx';

export const ADS_DATE_RANGES = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
] as const;

interface PerformanceDashboardProps {
  data: PerformanceDashboardData | null;
  loading?: boolean;
  onSelectAd?: (promotionId: string) => void;
  selectedAdId?: string | null;
  adType: string;
  days: number;
}

function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export default function PerformanceDashboard({
  data,
  loading,
  onSelectAd,
  selectedAdId,
  adType,
}: PerformanceDashboardProps) {
  const filteredAds = useMemo(() => {
    if (!data) return [];
    return data.ads.filter((a) => !adType || a.adType === adType);
  }, [data, adType]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading performance…
      </div>
    );
  }

  if (!data) return null;

  const totals = data.totals;
  const hasAds = data.ads.length > 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6">
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
            <Card key={stat.label} className="min-w-0 border-border p-3 shadow-none sm:p-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-1 text-[15px] font-semibold tabular-nums text-foreground">{stat.value}</p>
            </Card>
          ))}
      </div>

      {!hasAds ? (
        <Card className="border-border p-5 shadow-none sm:p-6">
          <p className="text-[13px] text-muted-foreground">
            No published ads yet. Create and launch an ad to start tracking performance here.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-border p-0 shadow-none">
          <Table containerClassName="rounded-none border-0">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {['Ad', 'Impr.', 'CTR', 'Spend', 'Leads', 'CPL'].map((heading) => (
                  <TableHead key={heading}>{heading}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAds.map((ad) => {
                const label = ad.projectAddress || ad.headline || ad.projectTitle || 'Ad';
                const selected = selectedAdId === ad.promotionId;
                return (
                  <TableRow
                    key={ad.promotionId}
                    onClick={() => onSelectAd?.(ad.promotionId)}
                    className={clsx(
                      onSelectAd && 'cursor-pointer',
                      selected && 'bg-brand-50/50',
                    )}
                  >
                    <TableCell>
                      <span className="block max-w-[200px] truncate text-sm font-medium text-foreground">
                        {label}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums text-sm text-muted-foreground">
                      {ad.impressions.toLocaleString()}
                    </TableCell>
                    <TableCell className="tabular-nums text-sm text-muted-foreground">
                      {ad.ctr.toFixed(2)}%
                    </TableCell>
                    <TableCell className="tabular-nums text-sm text-muted-foreground">
                      {formatMoney(ad.spendCents)}
                    </TableCell>
                    <TableCell className="tabular-nums text-sm text-muted-foreground">{ad.leads}</TableCell>
                    <TableCell className="tabular-nums text-sm text-muted-foreground">
                      {ad.costPerLead != null ? formatMoney(ad.costPerLead) : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

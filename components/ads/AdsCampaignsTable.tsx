'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { AdCampaign } from '@/lib/ads/types';
import { formatCompactPrice } from '@/lib/format-price';
import clsx from 'clsx';

interface AdsCampaignsTableProps {
  campaigns: AdCampaign[];
  loading?: boolean;
}

const STATUS_STYLES: Record<AdCampaign['status'], string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paused: 'bg-amber-50 text-amber-800 border-amber-200',
  ended: 'bg-gray-100 text-gray-600 border-gray-200',
  draft: 'bg-gray-50 text-gray-500 border-gray-200',
};

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export default function AdsCampaignsTable({ campaigns, loading }: AdsCampaignsTableProps) {
  if (loading) {
    return (
      <div className="rounded-[10px] border border-gray-200 bg-white overflow-hidden animate-pulse">
        <div className="px-4 py-3 border-b border-gray-150 h-10 bg-gray-50" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-4 py-4 border-b border-gray-100 last:border-0">
            <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
            <div className="h-3 bg-gray-50 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
        <p className="text-[13px] font-semibold text-gray-900">No campaigns to show yet</p>
        <p className="text-caption text-gray-500 mt-2 max-w-md mx-auto">
          Connect Google Ads or Meta Ads above. Meta campaigns sync automatically; Google Ads live
          sync requires a Google Ads API developer token.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border border-gray-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-gray-150 bg-gray-50/80">
              {['Campaign', 'Platform', 'Status', 'Spend', 'Impressions', 'Clicks', 'Leads', ''].map(
                (heading) => (
                  <th
                    key={heading || 'actions'}
                    className={clsx(
                      'px-4 py-[9px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-450',
                      heading === 'Spend' || heading === 'Impressions' || heading === 'Clicks' || heading === 'Leads'
                        ? 'text-right'
                        : ''
                    )}
                  >
                    {heading}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {campaigns.map((campaign) => (
              <tr key={`${campaign.platform}-${campaign.id}`} className="hover:bg-gray-50/60">
                <td className="px-4 py-[11px]">
                  <p className="text-[13px] font-medium text-gray-900 truncate max-w-[220px]">
                    {campaign.name}
                  </p>
                  <p className="text-caption text-gray-500 capitalize mt-0.5">{campaign.objective}</p>
                </td>
                <td className="px-4 py-[11px]">
                  <span className="text-[12.5px] text-gray-700 capitalize">{campaign.platform}</span>
                </td>
                <td className="px-4 py-[11px]">
                  <span
                    className={clsx(
                      'inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border capitalize',
                      STATUS_STYLES[campaign.status]
                    )}
                  >
                    {campaign.status}
                  </span>
                </td>
                <td className="px-4 py-[11px] text-right text-price text-[13px]">
                  {formatCompactPrice(campaign.spend)}
                </td>
                <td className="px-4 py-[11px] text-right font-mono text-[12.5px] tabular-nums text-gray-700">
                  {formatNumber(campaign.impressions)}
                </td>
                <td className="px-4 py-[11px] text-right font-mono text-[12.5px] tabular-nums text-gray-700">
                  {formatNumber(campaign.clicks)}
                </td>
                <td className="px-4 py-[11px] text-right font-mono text-[12.5px] tabular-nums text-gray-700">
                  {formatNumber(campaign.conversions)}
                </td>
                <td className="px-4 py-[11px] text-right">
                  <Link
                    href={campaign.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] font-medium text-brand-600 hover:text-brand-700"
                  >
                    Manage
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

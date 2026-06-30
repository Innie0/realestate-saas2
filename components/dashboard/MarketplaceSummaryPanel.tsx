'use client';

import { useState } from 'react';
import Link from 'next/link';
import Surface from '@/components/ui/Surface';
import Button from '@/components/ui/Button';
import { useApi } from '@/lib/swr';
import { useToast } from '@/components/providers/ToastProvider';
import { ArrowRight, Globe, Inbox, Loader2, MapPin, Plus, RefreshCw } from 'lucide-react';

interface MarketplaceSummary {
  publishedCount: number;
  draftCount: number;
  draftReadyToPublish: number;
  needsReviewCount: number;
  recentPublished: {
    id: string;
    title: string;
    address: string;
    publishedAt: string | null;
  }[];
  recentListingInquiries: {
    id: string;
    name: string;
    createdAt: string;
    projectId: string | null;
    listingLabel: string | null;
  }[];
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function MarketplaceSummaryPanel() {
  const { data, isLoading, mutate } = useApi<MarketplaceSummary>(
    '/api/dashboard/marketplace-summary'
  );
  const toast = useToast();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/listings/sync', { method: 'POST' });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || 'Sync failed');
        return;
      }
      toast.success(json.data?.message || 'Listings synced');
      await mutate();
    } catch {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (isLoading && !data) {
    return (
      <Surface padding="md" className="animate-pulse space-y-3">
        <div className="h-4 bg-gray-100 rounded w-40" />
        <div className="h-8 bg-gray-100 rounded w-full" />
        <div className="h-16 bg-gray-100 rounded w-full" />
      </Surface>
    );
  }

  if (!data) return null;

  const hasActivity =
    data.publishedCount > 0 ||
    data.recentListingInquiries.length > 0 ||
    data.draftCount > 0;

  if (!hasActivity) {
    return (
      <Surface padding="md">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-brand-500/10 text-brand-600 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-label mb-1">Realestic marketplace</p>
            <p className="text-body font-medium text-gray-900">Publish your first listing</p>
            <p className="text-caption text-gray-500 mt-1">
              When you publish a project, it appears on realestic.ai and buyers can inquire
              directly.
            </p>
            <Link href="/dashboard/projects/new" className="inline-block mt-3">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                New listing
              </Button>
            </Link>
          </div>
        </div>
      </Surface>
    );
  }

  return (
    <Surface padding="md">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-brand-600" />
          <p className="text-label">Realestic marketplace</p>
        </div>
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          View site
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5">
          <p className="text-2xl font-bold text-gray-900">{data.publishedCount}</p>
          <p className="text-xs text-gray-500">Live listings</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5">
          <p className="text-2xl font-bold text-gray-900">{data.recentListingInquiries.length}</p>
          <p className="text-xs text-gray-500">Recent inquiries</p>
        </div>
      </div>

      {data.publishedCount > 0 && (
        <Button
          size="sm"
          variant="outline"
          className="w-full mb-4"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-1.5" />
          )}
          Sync prices &amp; sold status
        </Button>
      )}

      {data.needsReviewCount > 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
          {data.needsReviewCount} listing{data.needsReviewCount === 1 ? '' : 's'} need a manual
          review after sync.
        </p>
      )}

      {data.recentListingInquiries.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Listing inquiries
          </p>
          <ul className="space-y-2">
            {data.recentListingInquiries.slice(0, 3).map((inquiry) => (
              <li key={inquiry.id}>
                <Link
                  href="/dashboard/leads"
                  className="flex items-start gap-2 rounded-lg border border-gray-200 px-3 py-2 hover:border-brand-300 hover:bg-brand-50/30 transition-colors"
                >
                  <Inbox className="w-3.5 h-3.5 text-brand-600 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{inquiry.name}</p>
                    {inquiry.listingLabel && (
                      <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {inquiry.listingLabel}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {timeAgo(inquiry.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.recentPublished.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Live on Realestic
          </p>
          <ul className="space-y-1.5">
            {data.recentPublished.map((listing) => (
              <li key={listing.id}>
                <Link
                  href={`/dashboard/projects/${listing.id}`}
                  className="flex items-center justify-between gap-2 text-sm text-gray-700 hover:text-brand-600 py-1"
                >
                  <span className="truncate">{listing.address}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 opacity-40" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.draftCount > 0 && (
        <Link href="/dashboard/projects">
          <p className="text-xs text-gray-500 hover:text-brand-600 transition-colors">
            {data.draftCount} draft{data.draftCount === 1 ? '' : 's'}
            {data.draftReadyToPublish > 0
              ? ` · ${data.draftReadyToPublish} almost ready to publish`
              : ''}
            <ArrowRight className="w-3 h-3 inline ml-0.5" />
          </p>
        </Link>
      )}
    </Surface>
  );
}

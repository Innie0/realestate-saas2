'use client';

import Button from '@/components/ui/Button';
import Surface from '@/components/ui/Surface';
import Switch from '@/components/ui/Switch';
import { getListingPublishReadiness } from '@/lib/listing-publish';
import type { Project } from '@/types';
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  Circle,
} from 'lucide-react';

interface ListingPublishPanelProps {
  project: Project;
  isPublishing: boolean;
  isSyncing?: boolean;
  linkCopied: boolean;
  publicListingUrl: string;
  onTogglePublish: () => void;
  onCopyLink: () => void;
  onSync?: () => void;
}

export default function ListingPublishPanel({
  project,
  isPublishing,
  isSyncing = false,
  linkCopied,
  publicListingUrl,
  onTogglePublish,
  onCopyLink,
  onSync,
}: ListingPublishPanelProps) {
  const { checks, ready } = getListingPublishReadiness(project);
  const marketplaceSearchUrl = '/?search=1';

  const lastSynced = project.last_synced_at
    ? new Date(project.last_synced_at).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  return (
    <Surface flat className="p-5 sm:p-[22px]">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-gray-100 text-gray-900">
            <Globe className="w-[18px] h-[18px]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-gray-900">Realestic marketplace</h2>
            <p className="text-[13px] text-gray-600 mt-1 max-w-xl">
              Publish to appear on realestic.ai search. Buyers can view photos, price, and send
              inquiries straight to your leads inbox.
            </p>
            <p className="text-[12px] text-gray-450 mt-2 font-mono">
              {lastSynced ? `Last Rentcast sync: ${lastSynced}` : 'Not synced yet'}
              {project.listing_status === 'unknown' && project.published && (
                <span className="text-amber-700"> · Needs manual review</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Switch
            checked={!!project.published}
            onChange={onTogglePublish}
            disabled={isPublishing || (!project.published && !ready)}
            title={!project.published && !ready ? 'Complete the checklist below before publishing' : undefined}
            label="Live on Realestic"
          />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-gray-150">
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-gray-450 mb-3">
          Marketplace checklist
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {checks.map((check) => (
            <li
              key={check.id}
              className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-[13px] ${
                check.ok ? 'bg-teal-50 text-teal-700' : 'bg-gray-50 text-gray-600 border border-gray-150'
              }`}
            >
              {check.ok ? (
                <Check className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
              ) : (
                <Circle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" aria-hidden />
              )}
              <div className="min-w-0">
                <p className="font-medium">{check.label}</p>
                {!check.ok && <p className="text-xs text-gray-450 mt-0.5">{check.hint}</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(`/listing/${project.id}`, '_blank')}
          disabled={!ready && !project.published}
        >
          <ExternalLink className="w-4 h-4 mr-1" />
          Preview listing page
        </Button>
        {project.published && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(marketplaceSearchUrl, '_blank')}
          >
            <Search className="w-4 h-4 mr-1" />
            View on marketplace
          </Button>
        )}
        {onSync && (
          <Button variant="outline" size="sm" onClick={onSync} disabled={isSyncing}>
            {isSyncing ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-1" />
            )}
            Sync with Rentcast
          </Button>
        )}
      </div>

      {project.published && (
        <div className="mt-4 pt-4 border-t border-gray-150 flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-150 font-mono text-[12.5px] text-gray-600 truncate min-w-0">
            <Link2 className="w-4 h-4 shrink-0 text-gray-450" />
            <span className="truncate">{publicListingUrl}</span>
          </div>
          <Button variant="outline" size="sm" onClick={onCopyLink}>
            {linkCopied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Copy link
              </>
            )}
          </Button>
        </div>
      )}
    </Surface>
  );
}

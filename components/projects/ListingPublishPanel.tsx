'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { getListingPublishReadiness } from '@/lib/listing-publish';
import type { Project } from '@/types';
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Link2,
  Search,
  Circle,
} from 'lucide-react';

interface ListingPublishPanelProps {
  project: Project;
  isPublishing: boolean;
  linkCopied: boolean;
  publicListingUrl: string;
  onTogglePublish: () => void;
  onCopyLink: () => void;
}

export default function ListingPublishPanel({
  project,
  isPublishing,
  linkCopied,
  publicListingUrl,
  onTogglePublish,
  onCopyLink,
}: ListingPublishPanelProps) {
  const { checks, ready } = getListingPublishReadiness(project);
  const marketplaceSearchUrl = '/?search=1';

  return (
    <Card className="mb-6 border border-gray-200">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-brand-500/10 text-brand-600 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">Realestic marketplace</h2>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">
              Publish to appear on realestic.ai search. Buyers can view photos, price, and send
              inquiries straight to your leads inbox.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onTogglePublish}
            disabled={isPublishing || (!project.published && !ready)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
              project.published ? 'bg-brand-500' : 'bg-gray-300'
            } ${isPublishing || (!project.published && !ready) ? 'opacity-60 cursor-not-allowed' : ''}`}
            aria-pressed={!!project.published}
            aria-label="Publish to marketplace"
            title={
              !project.published && !ready
                ? 'Complete the checklist below before publishing'
                : undefined
            }
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                project.published ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm font-medium text-gray-700">
            {project.published ? 'Live on Realestic' : 'Draft'}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Marketplace checklist
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {checks.map((check) => (
            <li
              key={check.id}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                check.ok
                  ? 'border-emerald-200 bg-emerald-50/60 text-gray-800'
                  : 'border-gray-200 bg-gray-50 text-gray-600'
              }`}
            >
              {check.ok ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
              ) : (
                <Circle className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" aria-hidden />
              )}
              <div className="min-w-0">
                <p className="font-medium">{check.label}</p>
                {!check.ok && <p className="text-xs text-gray-500 mt-0.5">{check.hint}</p>}
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
      </div>

      {project.published && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-600 truncate min-w-0">
            <Link2 className="w-4 h-4 shrink-0 text-gray-400" />
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
    </Card>
  );
}

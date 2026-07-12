'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Loader2, Megaphone, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Surface from '@/components/ui/Surface';
import { useApi } from '@/lib/swr';
import { formatListingAddress, formatListingPrice, normalizeProjectImages } from '@/lib/listing-utils';
import { isProjectPromotable } from '@/lib/ads/listing-ad-copy';
import type { Project } from '@/types';
import clsx from 'clsx';

const BUDGET_OPTIONS = [
  { cents: 1000, label: '$10/day' },
  { cents: 1500, label: '$15/day' },
  { cents: 2000, label: '$20/day' },
  { cents: 3000, label: '$30/day' },
  { cents: 5000, label: '$50/day' },
];

const DURATION_OPTIONS = [
  { days: 7, label: '1 week' },
  { days: 14, label: '2 weeks' },
];

interface PromoteListingWizardProps {
  initialProjectId?: string | null;
  metaConnected: boolean;
  onConnectMeta: () => void;
  connectingMeta: boolean;
  onLaunched?: () => void;
  onMessage?: (message: { type: 'success' | 'error'; text: string }) => void;
}

export default function PromoteListingWizard({
  initialProjectId,
  metaConnected,
  onConnectMeta,
  connectingMeta,
  onLaunched,
  onMessage,
}: PromoteListingWizardProps) {
  const { data: projects = [], isLoading: projectsLoading } = useApi<Project[]>('/api/projects');
  const [selectedId, setSelectedId] = useState<string | null>(initialProjectId ?? null);
  const [dailyBudgetCents, setDailyBudgetCents] = useState(2000);
  const [durationDays, setDurationDays] = useState(7);
  const [launching, setLaunching] = useState(false);

  const promotableProjects = useMemo(
    () => projects.filter((p) => isProjectPromotable(p).ok),
    [projects]
  );

  const effectiveProjectId = selectedId ?? initialProjectId ?? null;
  const totalSpend = (dailyBudgetCents / 100) * durationDays;

  const handleLaunch = async () => {
    if (!effectiveProjectId) {
      onMessage?.({ type: 'error', text: 'Choose a listing to promote.' });
      return;
    }
    if (!metaConnected) {
      onConnectMeta();
      return;
    }

    setLaunching(true);
    try {
      const res = await fetch('/api/ads/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: effectiveProjectId,
          dailyBudgetCents,
          durationDays,
        }),
      });
      const json = await res.json();
      if (json.success) {
        onMessage?.({
          type: 'success',
          text: json.message || 'Your listing ad is live. Leads will show up in your inbox.',
        });
        onLaunched?.();
      } else {
        onMessage?.({ type: 'error', text: json.error || 'Could not launch the ad.' });
      }
    } catch {
      onMessage?.({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setLaunching(false);
    }
  };

  return (
    <Surface flat padding="md" className="border-brand-200/60 bg-gradient-to-br from-white to-brand-50/30">
      <div className="flex items-start gap-3 mb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-500 text-white">
          <Sparkles className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Promote a listing</h2>
          <p className="text-caption text-gray-500 mt-1 max-w-xl">
            Pick a listing, set a daily budget, and we&apos;ll create and run the Meta ad for you.
            Leads land in your inbox automatically.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-label mb-2">Listing</p>
          {projectsLoading ? (
            <p className="text-caption text-gray-500">Loading your listings…</p>
          ) : promotableProjects.length === 0 ? (
            <p className="text-[13px] text-gray-600 rounded-lg border border-dashed border-gray-200 px-4 py-3">
              Publish a listing with photos and an address first, then come back to promote it.
            </p>
          ) : (
            <div className="grid gap-2 max-h-52 overflow-y-auto pr-1">
              {promotableProjects.map((project) => {
                const info = project.property_info || {};
                const address = formatListingAddress(info, project.title);
                const price = formatListingPrice(info.price);
                const thumb = normalizeProjectImages(project.images)[0];
                const isSelected = effectiveProjectId === project.id;

                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedId(project.id)}
                    className={clsx(
                      'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-gray-100">
                      {thumb ? (
                        <Image src={thumb} alt="" fill className="object-cover" sizes="44px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <Megaphone className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-gray-900 truncate">{address}</p>
                      <p className="text-[12px] text-gray-500 tabular-nums">{price}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <p className="text-label mb-2">Daily budget</p>
          <div className="flex flex-wrap gap-2">
            {BUDGET_OPTIONS.map((opt) => (
              <button
                key={opt.cents}
                type="button"
                onClick={() => setDailyBudgetCents(opt.cents)}
                className={clsx(
                  'rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-colors',
                  dailyBudgetCents === opt.cents
                    ? 'border-brand-500 bg-brand-50 text-brand-800'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-label mb-2">Run for</p>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                type="button"
                onClick={() => setDurationDays(opt.days)}
                className={clsx(
                  'rounded-lg border px-3.5 py-2 text-[13px] font-medium transition-colors',
                  durationDays === opt.days
                    ? 'border-brand-500 bg-brand-50 text-brand-800'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-gray-500 mt-2">
            Estimated spend:{' '}
            <span className="font-medium text-gray-700 tabular-nums">
              ${totalSpend.toLocaleString('en-US')}
            </span>{' '}
            total (billed by Meta to your connected account)
          </p>
        </div>

        {!metaConnected ? (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-3">
            <p className="text-[13px] text-indigo-900 font-medium">Connect Meta to get started</p>
            <p className="text-[12px] text-indigo-700/80 mt-1">
              We create the ad on your Meta account — you stay in control of billing.
            </p>
            <Button size="sm" className="mt-3" onClick={onConnectMeta} disabled={connectingMeta}>
              {connectingMeta && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Connect Meta Ads
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleLaunch}
            disabled={launching || !effectiveProjectId || promotableProjects.length === 0}
            className="w-full sm:w-auto gap-2"
          >
            {launching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Launching your ad…
              </>
            ) : (
              <>
                <Megaphone className="h-4 w-4" />
                Run ad for me
              </>
            )}
          </Button>
        )}
      </div>
    </Surface>
  );
}

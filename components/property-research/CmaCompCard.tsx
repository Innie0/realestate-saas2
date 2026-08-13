'use client';

import Image from 'next/image';
import { Home, X } from 'lucide-react';
import { formatListingStatus } from '@/lib/comp-filters';
import { similarityScoreToMatchPercent, type ScoredComp } from '@/lib/cma';

function fmt(n: number | null | undefined, prefix = '') {
  if (n === null || n === undefined) return '—';
  return `${prefix}${n.toLocaleString()}`;
}

function fmtDate(s: string | null) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return s;
  }
}

export interface CmaCompCardProps {
  comp: ScoredComp;
  conditionedAdj: number | null;
  selectedForValuation: boolean;
  onToggleValuation: () => void;
  onExclude: () => void;
}

export default function CmaCompCard({
  comp,
  conditionedAdj,
  selectedForValuation,
  onToggleValuation,
  onExclude,
}: CmaCompCardProps) {
  const matchPct = similarityScoreToMatchPercent(comp.similarityScore);

  return (
    <div
      className={`overflow-hidden rounded-[10px] border ${
        selectedForValuation
          ? 'border-blue-200 bg-blue-50/40'
          : 'border-gray-150 bg-[var(--surface)]'
      }`}
    >
      <div className="flex gap-0 sm:gap-3">
        <div className="relative h-[88px] w-[100px] shrink-0 bg-gray-100 sm:h-[96px] sm:w-[120px]">
          {comp.imageUrl ? (
            <Image
              src={comp.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="120px"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <Home className="h-6 w-6" />
            </div>
          )}
          <div
            className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm ${
              matchPct >= 75
                ? 'bg-emerald-600 text-white'
                : matchPct >= 55
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800/85 text-white'
            }`}
          >
            {matchPct}% match
          </div>
        </div>

        <div className="min-w-0 flex-1 py-2.5 pr-2 sm:py-3 sm:pr-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[13px] font-medium leading-snug text-gray-900">{comp.address}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-gray-700">
                  <input
                    type="checkbox"
                    checked={selectedForValuation}
                    onChange={onToggleValuation}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  Use in valuation
                </label>
                {selectedForValuation && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800">
                    Selected
                  </span>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-start gap-1">
              <div className="text-right">
                <p className="text-[13px] font-bold text-gray-900">{fmt(comp.price, '$')}</p>
                {conditionedAdj && (
                  <p className="text-[10.5px] text-gray-600">Adj. {fmt(conditionedAdj, '$')}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onExclude}
                className="p-1 text-gray-400 hover:text-rose-500"
                aria-label="Remove comp"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-gray-600">
            {comp.bedrooms !== null && <span>{comp.bedrooms} bd</span>}
            {comp.bathrooms !== null && <span>{comp.bathrooms} ba</span>}
            {comp.squareFootage !== null && (
              <span>{comp.squareFootage.toLocaleString()} sqft</span>
            )}
            {comp.distance !== null && <span>{comp.distance.toFixed(2)} mi</span>}
            {comp.soldDate && (
              <span>
                {formatListingStatus(comp.listingStatus)} {fmtDate(comp.soldDate)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

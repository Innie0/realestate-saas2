'use client';

import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import {
  assessCmaConfidence,
  confidenceStyles,
  type CmaConfidence,
  type CmaConfidenceLevel,
} from '@/lib/cma-confidence';
import type { ScoredComp } from '@/lib/cma';

export interface CmaConfidenceBannerProps {
  valuationComps: ScoredComp[];
  suggestedPrice: number | null;
  avmPrice: number | null;
  afterSimilarity: number;
  validSold: number;
  conditionFactor: number;
  /** Precomputed from API (optional); live props override when comps change */
  initial?: CmaConfidence | null;
}

function ConfidenceIcon({ level }: { level: CmaConfidenceLevel }) {
  if (level === 'high') return <CheckCircle2 className="h-4 w-4 shrink-0" />;
  if (level === 'low') return <AlertTriangle className="h-4 w-4 shrink-0" />;
  return <Info className="h-4 w-4 shrink-0" />;
}

export default function CmaConfidenceBanner({
  valuationComps,
  suggestedPrice,
  avmPrice,
  afterSimilarity,
  validSold,
  conditionFactor,
  initial,
}: CmaConfidenceBannerProps) {
  const confidence =
    valuationComps.length > 0 || suggestedPrice
      ? assessCmaConfidence({
          valuationComps,
          suggestedPrice,
          avmPrice,
          afterSimilarity,
          validSold,
          conditionFactor,
        })
      : initial;

  if (!confidence) return null;

  const styles = confidenceStyles(confidence.level);

  return (
    <div
      className={`rounded-[10px] border px-4 py-3 ${styles.border} ${styles.bg} ${styles.text}`}
    >
      <div className="flex items-start gap-3">
        <ConfidenceIcon level={confidence.level} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-semibold">{confidence.label}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles.badge}`}
            >
              {confidence.level}
            </span>
            {confidence.avgMatchPercent !== null && (
              <span className="text-[11px] opacity-80">
                Avg match {confidence.avgMatchPercent}%
              </span>
            )}
          </div>
          <p className="mt-1 text-[12.5px] leading-relaxed opacity-90">{confidence.message}</p>
          {confidence.avmDivergence && confidence.avmDivergencePct !== null && (
            <p className="mt-1.5 text-[11.5px] font-medium">
              AVM differs by {confidence.avmDivergencePct}% from comp-based price.
            </p>
          )}
          {confidence.thinMarket && confidence.level === 'low' && suggestedPrice && (
            <p className="mt-1.5 text-[11.5px] font-medium">
              Suggested price shown as a starting point only — not enough strong comps for a tight
              range.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

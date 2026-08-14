/**
 * CMA confidence assessment — Breezy-style trust signals without MLS.
 */

import {
  similarityScoreToMatchPercent,
  type ScoredComp,
} from '@/lib/cma';

export type CmaConfidenceLevel = 'high' | 'medium' | 'low';

export interface CmaConfidence {
  level: CmaConfidenceLevel;
  label: string;
  message: string;
  thinMarket: boolean;
  avmDivergence: boolean;
  avmDivergencePct: number | null;
  avgMatchPercent: number | null;
  selectedCompCount: number;
  strongMatchCount: number;
}

const STRONG_MATCH_PCT = 55;
const HIGH_MATCH_AVG = 65;
const AVM_DIVERGENCE_WARN = 0.12;
const AVM_DIVERGENCE_HIGH = 0.2;
const MAX_ADJ_SPREAD_PCT = 0.18;

function adjustedSpreadPct(comps: ScoredComp[], conditionFactor: number): number | null {
  const prices = comps
    .map((c) => c.adjustedPrice)
    .filter((p): p is number => p !== null && p > 0)
    .map((p) => Math.round(p * conditionFactor));
  if (prices.length < 2) return null;
  const sorted = [...prices].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  if (!median) return null;
  return (sorted[sorted.length - 1] - sorted[0]) / median;
}

export function assessCmaConfidence(params: {
  valuationComps: ScoredComp[];
  suggestedPrice: number | null;
  avmPrice: number | null;
  afterSimilarity: number;
  validSold: number;
  conditionFactor?: number;
}): CmaConfidence {
  const { valuationComps, suggestedPrice, avmPrice, afterSimilarity, validSold } = params;
  const conditionFactor = params.conditionFactor ?? 1;

  const matchPercents = valuationComps.map((c) => similarityScoreToMatchPercent(c.similarityScore));
  const avgMatchPercent =
    matchPercents.length > 0
      ? Math.round(matchPercents.reduce((a, b) => a + b, 0) / matchPercents.length)
      : null;
  const strongMatchCount = matchPercents.filter((p) => p >= STRONG_MATCH_PCT).length;

  let avmDivergencePct: number | null = null;
  let avmDivergence = false;
  if (suggestedPrice && avmPrice && avmPrice > 0) {
    avmDivergencePct = Math.round((Math.abs(suggestedPrice - avmPrice) / avmPrice) * 100);
    avmDivergence = avmDivergencePct / 100 > AVM_DIVERGENCE_WARN;
  }

  const thinMarket =
    valuationComps.length < 3 ||
    afterSimilarity < 3 ||
    validSold < 3 ||
    (avgMatchPercent !== null && avgMatchPercent < 45);

  const spread = adjustedSpreadPct(valuationComps, conditionFactor);

  let level: CmaConfidenceLevel = 'medium';
  let label = 'Moderate confidence';
  let message =
    'Comparable set is usable. Review selected comps before sharing with a client.';

  if (
    !thinMarket &&
    valuationComps.length >= 3 &&
    strongMatchCount >= 2 &&
    avgMatchPercent !== null &&
    avgMatchPercent >= HIGH_MATCH_AVG &&
    (spread === null || spread <= MAX_ADJ_SPREAD_PCT) &&
    !avmDivergence
  ) {
    level = 'high';
    label = 'Strong comp match';
    message = `${valuationComps.length} similar closed sales support this price range.`;
  }

  if (
    thinMarket ||
    valuationComps.length < 2 ||
    !suggestedPrice ||
    (avgMatchPercent !== null && avgMatchPercent < 40) ||
    (avmDivergencePct !== null && avmDivergencePct / 100 > AVM_DIVERGENCE_HIGH)
  ) {
    level = 'low';
    label = thinMarket ? 'Thin market' : 'Low confidence';
    message = thinMarket
      ? 'Few similar closed sales nearby — widen search or add a known comp by address before relying on this price.'
      : 'Comp prices or automated value disagree — verify sales manually before listing.';
  } else if (avmDivergence) {
    level = 'medium';
    label = 'Review suggested price';
    message = `Comp-based price differs from AVM by ${avmDivergencePct}%. Confirm comps match the subject.`;
  }

  return {
    level,
    label,
    message,
    thinMarket,
    avmDivergence,
    avmDivergencePct,
    avgMatchPercent,
    selectedCompCount: valuationComps.length,
    strongMatchCount,
  };
}

export function confidenceStyles(level: CmaConfidenceLevel): {
  border: string;
  bg: string;
  text: string;
  badge: string;
} {
  switch (level) {
    case 'high':
      return {
        border: 'border-emerald-200',
        bg: 'bg-emerald-50/90',
        text: 'text-emerald-900',
        badge: 'bg-emerald-600 text-white',
      };
    case 'low':
      return {
        border: 'border-amber-200',
        bg: 'bg-amber-50/90',
        text: 'text-amber-950',
        badge: 'bg-amber-600 text-white',
      };
    default:
      return {
        border: 'border-blue-200',
        bg: 'bg-blue-50/80',
        text: 'text-blue-950',
        badge: 'bg-blue-600 text-white',
      };
  }
}

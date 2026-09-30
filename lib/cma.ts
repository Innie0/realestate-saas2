/**
 * CMA (Comparative Market Analysis) calculation utilities.
 * Comp-based valuation with market-time, list-to-sale, size, feature, and condition adjustments.
 */

import { isActiveListingComp, normalizeAddress } from '@/lib/comp-filters';
import type { CompPriceSource } from '@/lib/comp-fetch';

export type ConditionLevel =
  | 'below_average'
  | 'average'
  | 'updated'
  | 'renovated'
  | 'luxury';

export const CONDITION_OPTIONS: { value: ConditionLevel; label: string; factor: number }[] = [
  { value: 'below_average', label: 'Below average', factor: 0.92 },
  { value: 'average', label: 'Average', factor: 1.0 },
  { value: 'updated', label: 'Updated', factor: 1.04 },
  { value: 'renovated', label: 'Renovated', factor: 1.08 },
  { value: 'luxury', label: 'Luxury / high-end', factor: 1.15 },
];

export interface SubjectProperty {
  bedrooms: number | null;
  bathrooms: number | null;
  squareFootage: number | null;
  lotSize: number | null;
  yearBuilt: number | null;
  condition: ConditionLevel;
  hasPool: boolean;
  garageSpaces: number;
}

export interface CompRecord {
  address: string;
  propertyType: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFootage: number | null;
  pricePerSqft: number | null;
  daysOnMarket: number | null;
  soldDate: string | null;
  /** List date for active/pending comps */
  listedDate?: string | null;
  distance: number | null;
  latitude: number | null;
  longitude: number | null;
  listingStatus?: string | null;
  mlsNumber?: string | null;
  lotSize?: number | null;
  yearBuilt?: number | null;
  /** Known from public records; null when the source doesn't say */
  hasPool?: boolean | null;
  garageSpaces?: number | null;
  /** Whether `price` is a recorded sale or an asking price */
  priceSource?: CompPriceSource;
}

export interface CompAdjustment {
  label: string;
  amount: number;
}

export interface ScoredComp extends CompRecord {
  similarityScore: number;
  adjustments: CompAdjustment[];
  totalAdjustment: number;
  /** Comp's indicated value for the subject, before the condition factor */
  adjustedPrice: number | null;
  /** Market price change applied for time since sale (0.034 = +3.4%) */
  timeAdjustmentPct?: number | null;
  /** True when this comp is used in the suggested list price */
  selectedForValuation?: boolean;
  /** Set when agent adds a comp by address lookup */
  manuallyAdded?: boolean;
}

/** Maximum similarity score from scoreCompSimilarity (for match % display). */
export const SIMILARITY_SCORE_MAX = 110;

export function similarityScoreToMatchPercent(score: number): number {
  return Math.min(100, Math.max(0, Math.round((score / SIMILARITY_SCORE_MAX) * 100)));
}

export interface CmaValuation {
  suggestedPrice: number | null;
  priceLow: number | null;
  priceHigh: number | null;
  medianAdjustedPrice: number | null;
  compCount: number;
  medianPricePerSqft: number | null;
  conditionFactor: number;
}

const BED_ADJUSTMENT = 12_000;
const BATH_ADJUSTMENT = 7_500;
const POOL_ADJUSTMENT = 25_000;
const GARAGE_ADJUSTMENT = 15_000;
const MAX_GARAGE_DIFF = 3;

/** Homes typically sell ~3% under asking; applied to active and off-market list prices. */
export const LIST_TO_SALE_FACTOR = 0.97;

const TIME_ADJ_MAX_MONTHS = 24;
const DAYS_PER_MONTH = 30.44;

export function defaultSubject(): SubjectProperty {
  return {
    bedrooms: null,
    bathrooms: null,
    squareFootage: null,
    lotSize: null,
    yearBuilt: null,
    condition: 'average',
    hasPool: false,
    garageSpaces: 0,
  };
}

export function subjectFromRentcast(property: Record<string, unknown> | null): SubjectProperty {
  if (!property) return defaultSubject();
  // Sync subset — full enrichment runs in enrichSubjectFromRecords (API)
  const features =
    property.features && typeof property.features === 'object'
      ? (property.features as Record<string, unknown>)
      : null;
  const garageSpaces =
    typeof features?.garageSpaces === 'number' && features.garageSpaces > 0
      ? features.garageSpaces
      : features?.garage === true
        ? 1
        : 0;
  return {
    bedrooms: typeof property.bedrooms === 'number' ? property.bedrooms : null,
    bathrooms: typeof property.bathrooms === 'number' ? property.bathrooms : null,
    squareFootage: typeof property.squareFootage === 'number' ? property.squareFootage : null,
    lotSize: typeof property.lotSize === 'number' ? property.lotSize : null,
    yearBuilt: typeof property.yearBuilt === 'number' ? property.yearBuilt : null,
    condition: 'average',
    hasPool: features?.pool === true,
    garageSpaces,
  };
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function compPricePerSqft(comp: CompRecord): number | null {
  if (comp.pricePerSqft) return comp.pricePerSqft;
  if (comp.price && comp.squareFootage && comp.squareFootage > 0) {
    return Math.round(comp.price / comp.squareFootage);
  }
  return null;
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / 86_400_000 / DAYS_PER_MONTH;
}

/** Whether a comp's price is an asking price rather than a recorded sale. */
export function isAskingPriceComp(comp: CompRecord): boolean {
  if (comp.priceSource) return comp.priceSource !== 'recorded_sale';
  return isActiveListingComp(comp);
}

/** Price change to bring a closed comp's sale price to the valuation date. */
export function timeAdjustmentPct(
  comp: CompRecord,
  monthlyTrend: number | null,
  asOf: Date = new Date(),
): number | null {
  if (!monthlyTrend || !comp.soldDate) return null;
  const months = Math.min(TIME_ADJ_MAX_MONTHS, Math.max(0, monthsBetween(new Date(comp.soldDate), asOf)));
  const pct = Math.pow(1 + monthlyTrend, months) - 1;
  return Math.abs(pct) < 0.0005 ? null : Math.round(pct * 1000) / 1000;
}

/** Score how similar a comp is to the subject (higher = better match). */
export function scoreCompSimilarity(
  subject: SubjectProperty,
  comp: CompRecord,
  asOf: Date = new Date(),
): number {
  let score = 0;

  if (comp.price && comp.price > 0) score += 10;

  if (subject.squareFootage && comp.squareFootage) {
    const pctDiff = Math.abs(subject.squareFootage - comp.squareFootage) / subject.squareFootage;
    if (pctDiff <= 0.1) score += 35;
    else if (pctDiff <= 0.2) score += 25;
    else if (pctDiff <= 0.35) score += 10;
  } else if (comp.squareFootage) {
    score += 5;
  }

  if (subject.bedrooms !== null && comp.bedrooms !== null) {
    const bedDiff = Math.abs(subject.bedrooms - comp.bedrooms);
    if (bedDiff === 0) score += 20;
    else if (bedDiff === 1) score += 10;
  }

  if (subject.bathrooms !== null && comp.bathrooms !== null) {
    const bathDiff = Math.abs(subject.bathrooms - comp.bathrooms);
    if (bathDiff === 0) score += 15;
    else if (bathDiff <= 1) score += 8;
  }

  if (comp.distance !== null) {
    if (comp.distance <= 0.25) score += 15;
    else if (comp.distance <= 0.5) score += 10;
    else if (comp.distance <= 1) score += 5;
  }

  if (comp.soldDate) {
    const daysSince = (asOf.getTime() - new Date(comp.soldDate).getTime()) / 86_400_000;
    if (daysSince <= 180) score += 15;
    else if (daysSince <= 365) score += 10;
    else if (daysSince <= 730) score += 5;
  } else if (comp.listedDate) {
    const daysSince = (asOf.getTime() - new Date(comp.listedDate).getTime()) / 86_400_000;
    if (daysSince <= 90) score += 12;
    else if (daysSince <= 180) score += 8;
  }

  return score;
}

/**
 * Adjust a single comp toward the subject. The result (`adjustedPrice`) is what
 * this comp says the subject is worth, before the subject condition factor.
 */
export function adjustComp(
  subject: SubjectProperty,
  comp: CompRecord & { timeAdjustmentPct?: number | null },
): { adjustments: CompAdjustment[]; totalAdjustment: number; adjustedPrice: number | null } {
  if (!comp.price) {
    return { adjustments: [], totalAdjustment: 0, adjustedPrice: null };
  }

  const adjustments: CompAdjustment[] = [];
  let basis = comp.price;

  const timePct = comp.timeAdjustmentPct ?? 0;
  if (timePct) {
    const amount = Math.round(comp.price * timePct);
    adjustments.push({
      label: `Market change since sale (${timePct > 0 ? '+' : ''}${(timePct * 100).toFixed(1)}%)`,
      amount,
    });
    basis += amount;
  }

  if (isAskingPriceComp(comp)) {
    const amount = Math.round(basis * (LIST_TO_SALE_FACTOR - 1));
    adjustments.push({
      label: `Asking → est. sale price (${Math.round((LIST_TO_SALE_FACTOR - 1) * 100)}%)`,
      amount,
    });
    basis += amount;
  }

  let featureTotal = 0;

  if (subject.squareFootage && comp.squareFootage && comp.squareFootage > 0) {
    // $/sqft method: scale the comp's (time/list-adjusted) $/sqft to the subject's size.
    // Bed/bath counts are largely captured by living area, so they aren't adjusted again.
    const sqftDiff = subject.squareFootage - comp.squareFootage;
    if (sqftDiff !== 0) {
      const amount = Math.round(sqftDiff * (basis / comp.squareFootage));
      adjustments.push({
        label: `Size (${sqftDiff > 0 ? '+' : ''}${sqftDiff.toLocaleString()} sqft)`,
        amount,
      });
      featureTotal += amount;
    }
  } else {
    if (subject.bedrooms !== null && comp.bedrooms !== null) {
      const bedDiff = subject.bedrooms - comp.bedrooms;
      if (bedDiff !== 0) {
        const amount = bedDiff * BED_ADJUSTMENT;
        adjustments.push({ label: `Bedrooms (${bedDiff > 0 ? '+' : ''}${bedDiff})`, amount });
        featureTotal += amount;
      }
    }

    if (subject.bathrooms !== null && comp.bathrooms !== null) {
      const bathDiff = subject.bathrooms - comp.bathrooms;
      if (Math.abs(bathDiff) >= 0.5) {
        const amount = Math.round((Math.round(bathDiff * 2) / 2) * BATH_ADJUSTMENT);
        if (amount !== 0) {
          adjustments.push({ label: `Bathrooms (${bathDiff > 0 ? '+' : ''}${bathDiff})`, amount });
          featureTotal += amount;
        }
      }
    }
  }

  // Feature adjustments only when the comp's features are known — never assume
  if (typeof comp.hasPool === 'boolean' && comp.hasPool !== subject.hasPool) {
    const amount = subject.hasPool ? POOL_ADJUSTMENT : -POOL_ADJUSTMENT;
    adjustments.push({ label: subject.hasPool ? 'Pool (subject only)' : 'Pool (comp only)', amount });
    featureTotal += amount;
  }

  if (typeof comp.garageSpaces === 'number') {
    const diff = Math.max(
      -MAX_GARAGE_DIFF,
      Math.min(MAX_GARAGE_DIFF, subject.garageSpaces - comp.garageSpaces),
    );
    if (diff !== 0) {
      const amount = diff * GARAGE_ADJUSTMENT;
      adjustments.push({ label: `Garage (${diff > 0 ? '+' : ''}${diff} sp)`, amount });
      featureTotal += amount;
    }
  }

  const adjustedPrice = Math.round(basis + featureTotal);
  return {
    adjustments,
    totalAdjustment: adjustedPrice - comp.price,
    adjustedPrice,
  };
}

export function getConditionFactor(condition: ConditionLevel): number {
  return CONDITION_OPTIONS.find((c) => c.value === condition)?.factor ?? 1;
}

/** Suggested price (mean) and range (min/max) from comps' indicated values. */
function summarizeIndicatedValues(
  indicated: number[],
  conditionFactor: number,
): Pick<CmaValuation, 'suggestedPrice' | 'priceLow' | 'priceHigh'> {
  const conditioned = indicated.filter((p) => p > 0).map((p) => Math.round(p * conditionFactor));
  if (conditioned.length === 0) {
    return { suggestedPrice: null, priceLow: null, priceHigh: null };
  }
  const suggestedPrice = Math.round(
    conditioned.reduce((sum, v) => sum + v, 0) / conditioned.length,
  );
  if (conditioned.length === 1) {
    return {
      suggestedPrice,
      priceLow: Math.round(suggestedPrice * 0.97),
      priceHigh: Math.round(suggestedPrice * 1.03),
    };
  }
  return {
    suggestedPrice,
    priceLow: Math.min(...conditioned),
    priceHigh: Math.max(...conditioned),
  };
}

/** Recompute valuation using only AI- or agent-selected comps. */
export function valueFromSelectedComps(
  subject: SubjectProperty,
  scoredComps: ScoredComp[],
): { scoredComps: ScoredComp[]; valuation: CmaValuation } {
  const selected = scoredComps.filter((c) => c.selectedForValuation && c.price && c.price > 0);

  const reScoredSelected = selected.map((comp) => ({ ...comp, ...adjustComp(subject, comp) }));

  const selectedByAddress = new Map(
    reScoredSelected.map((c) => [normalizeAddress(c.address), c] as const),
  );

  const merged = scoredComps.map((comp) => {
    const updated = selectedByAddress.get(normalizeAddress(comp.address));
    return updated ?? comp;
  });

  const conditionFactor = getConditionFactor(subject.condition);
  const indicated = reScoredSelected
    .map((c) => c.adjustedPrice)
    .filter((p): p is number => p !== null && p > 0);
  const range = summarizeIndicatedValues(indicated, conditionFactor);

  const ppsfValues = selected
    .map(compPricePerSqft)
    .filter((v): v is number => v !== null && v > 0);

  return {
    scoredComps: merged,
    valuation: {
      ...range,
      medianAdjustedPrice: range.suggestedPrice,
      compCount: reScoredSelected.length,
      medianPricePerSqft: median(ppsfValues),
      conditionFactor,
    },
  };
}

/** Score, rank, and value comps against the subject property. */
export function calculateCma(
  subject: SubjectProperty,
  comps: CompRecord[],
  options?: {
    asOf?: Date;
    /** Monthly market price trend (see lib/market-trend); omit or null for no time adjustment */
    marketTrend?: number | null;
  },
): { scoredComps: ScoredComp[]; valuation: CmaValuation } {
  const asOf = options?.asOf ?? new Date();
  const validComps = comps.filter((c) => c.price && c.price > 0);
  const trend = options?.marketTrend ?? null;

  const scored = validComps
    .map((comp) => {
      const withTime = { ...comp, timeAdjustmentPct: timeAdjustmentPct(comp, trend, asOf) };
      return {
        ...withTime,
        similarityScore: scoreCompSimilarity(subject, comp, asOf),
        ...adjustComp(subject, withTime),
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore);

  // Prefer comps with reasonable similarity; fall back to all valid if sparse market
  const qualified = scored.filter((c) => c.similarityScore >= 25);
  const compsForValuation = qualified.length >= 2 ? qualified : scored;

  const conditionFactor = getConditionFactor(subject.condition);
  const range = summarizeIndicatedValues(
    compsForValuation.map((c) => c.adjustedPrice).filter((p): p is number => p !== null),
    conditionFactor,
  );

  const ppsfValues = validComps
    .map(compPricePerSqft)
    .filter((v): v is number => v !== null && v > 0);

  return {
    scoredComps: scored,
    valuation: {
      ...range,
      medianAdjustedPrice: range.suggestedPrice,
      compCount: compsForValuation.length,
      medianPricePerSqft: median(ppsfValues),
      conditionFactor,
    },
  };
}

/** Recalculate valuation from a subset of comps (e.g. after exclusions). */
export function recalculateValuation(
  subject: SubjectProperty,
  activeComps: CompRecord[],
  medianPpsf: number | null
): CmaValuation {
  const conditionFactor = getConditionFactor(subject.condition);
  const indicated = activeComps
    .filter((c) => c.price && c.price > 0)
    .map((comp) => adjustComp(subject, comp).adjustedPrice)
    .filter((p): p is number => p !== null);

  const range = summarizeIndicatedValues(indicated, conditionFactor);
  return {
    ...range,
    medianAdjustedPrice: range.suggestedPrice,
    compCount: indicated.length,
    medianPricePerSqft: medianPpsf,
    conditionFactor,
  };
}

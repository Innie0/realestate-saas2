/**
 * CMA (Comparative Market Analysis) calculation utilities.
 * Comp-based valuation with size, bed/bath, and condition adjustments.
 */

import { normalizeAddress } from '@/lib/comp-filters';

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
  distance: number | null;
  latitude: number | null;
  longitude: number | null;
  listingStatus?: string | null;
  mlsNumber?: string | null;
}

export interface CompAdjustment {
  label: string;
  amount: number;
}

export interface ScoredComp extends CompRecord {
  similarityScore: number;
  adjustments: CompAdjustment[];
  totalAdjustment: number;
  adjustedPrice: number | null;
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

/** Score how similar a comp is to the subject (higher = better match). */
export function scoreCompSimilarity(subject: SubjectProperty, comp: CompRecord): number {
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
    const daysSince = (Date.now() - new Date(comp.soldDate).getTime()) / 86_400_000;
    if (daysSince <= 180) score += 15;
    else if (daysSince <= 365) score += 10;
    else if (daysSince <= 730) score += 5;
  }

  return score;
}

/** Adjust a single comp sale price toward the subject property. */
export function adjustComp(
  subject: SubjectProperty,
  comp: CompRecord,
  medianPpsf: number | null
): { adjustments: CompAdjustment[]; totalAdjustment: number; adjustedPrice: number | null } {
  if (!comp.price) {
    return { adjustments: [], totalAdjustment: 0, adjustedPrice: null };
  }

  const adjustments: CompAdjustment[] = [];
  let total = 0;

  const ppsf = medianPpsf ?? compPricePerSqft(comp);
  if (ppsf && subject.squareFootage && comp.squareFootage) {
    const sqftDiff = subject.squareFootage - comp.squareFootage;
    if (sqftDiff !== 0) {
      const amount = Math.round(sqftDiff * ppsf);
      adjustments.push({
        label: `Size (${sqftDiff > 0 ? '+' : ''}${sqftDiff.toLocaleString()} sqft)`,
        amount,
      });
      total += amount;
    }
  }

  if (subject.bedrooms !== null && comp.bedrooms !== null) {
    const bedDiff = subject.bedrooms - comp.bedrooms;
    if (bedDiff !== 0) {
      const amount = bedDiff * BED_ADJUSTMENT;
      adjustments.push({
        label: `Bedrooms (${bedDiff > 0 ? '+' : ''}${bedDiff})`,
        amount,
      });
      total += amount;
    }
  }

  if (subject.bathrooms !== null && comp.bathrooms !== null) {
    const bathDiff = subject.bathrooms - comp.bathrooms;
    if (Math.abs(bathDiff) >= 0.5) {
      const bathSteps = Math.round(bathDiff * 2) / 2;
      const amount = Math.round(bathSteps * BATH_ADJUSTMENT);
      if (amount !== 0) {
        adjustments.push({
          label: `Bathrooms (${bathDiff > 0 ? '+' : ''}${bathDiff})`,
          amount,
        });
        total += amount;
      }
    }
  }

  // Subject amenities — comps assumed average unless we know otherwise
  if (subject.hasPool) {
    adjustments.push({ label: 'Pool (subject)', amount: POOL_ADJUSTMENT });
    total += POOL_ADJUSTMENT;
  }

  if (subject.garageSpaces > 0) {
    const amount = subject.garageSpaces * GARAGE_ADJUSTMENT;
    adjustments.push({ label: `Garage (${subject.garageSpaces} sp)`, amount });
    total += amount;
  }

  return {
    adjustments,
    totalAdjustment: total,
    adjustedPrice: Math.round(comp.price + total),
  };
}

export function getConditionFactor(condition: ConditionLevel): number {
  return CONDITION_OPTIONS.find((c) => c.value === condition)?.factor ?? 1;
}

/** Recompute valuation using only AI- or agent-selected comps. */
export function valueFromSelectedComps(
  subject: SubjectProperty,
  scoredComps: ScoredComp[],
): { scoredComps: ScoredComp[]; valuation: CmaValuation } {
  const selected = scoredComps.filter((c) => c.selectedForValuation && c.price && c.price > 0);

  const ppsfValues = selected
    .map(compPricePerSqft)
    .filter((v): v is number => v !== null && v > 0);
  const medianPpsf = median(ppsfValues);

  const reScoredSelected = selected.map((comp) => {
    const { adjustments, totalAdjustment, adjustedPrice } = adjustComp(subject, comp, medianPpsf);
    return { ...comp, adjustments, totalAdjustment, adjustedPrice };
  });

  const selectedByAddress = new Map(
    reScoredSelected.map((c) => [normalizeAddress(c.address), c] as const),
  );

  const merged = scoredComps.map((comp) => {
    const updated = selectedByAddress.get(normalizeAddress(comp.address));
    return updated ?? comp;
  });

  const conditionFactor = getConditionFactor(subject.condition);
  const conditioned = reScoredSelected
    .map((c) => c.adjustedPrice)
    .filter((p): p is number => p !== null && p > 0)
    .map((p) => Math.round(p * conditionFactor));

  const medianAdjusted = median(conditioned);
  let priceLow: number | null = null;
  let priceHigh: number | null = null;

  if (conditioned.length >= 2) {
    const sorted = [...conditioned].sort((a, b) => a - b);
    priceLow = sorted[0];
    priceHigh = sorted[sorted.length - 1];
  } else if (conditioned.length === 1) {
    priceLow = Math.round(conditioned[0] * 0.97);
    priceHigh = Math.round(conditioned[0] * 1.03);
  }

  return {
    scoredComps: merged,
    valuation: {
      suggestedPrice: medianAdjusted,
      priceLow,
      priceHigh,
      medianAdjustedPrice: medianAdjusted,
      compCount: reScoredSelected.length,
      medianPricePerSqft: medianPpsf,
      conditionFactor,
    },
  };
}

/** Score, rank, and value comps against the subject property. */
export function calculateCma(
  subject: SubjectProperty,
  comps: CompRecord[]
): { scoredComps: ScoredComp[]; valuation: CmaValuation } {
  const validComps = comps.filter((c) => c.price && c.price > 0);

  const ppsfValues = validComps
    .map(compPricePerSqft)
    .filter((v): v is number => v !== null && v > 0);
  const medianPpsf = median(ppsfValues);

  const scored = validComps
    .map((comp) => {
      const similarityScore = scoreCompSimilarity(subject, comp);
      const { adjustments, totalAdjustment, adjustedPrice } = adjustComp(
        subject,
        comp,
        medianPpsf
      );
      return {
        ...comp,
        similarityScore,
        adjustments,
        totalAdjustment,
        adjustedPrice,
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore);

  // Prefer comps with reasonable similarity; fall back to all valid if sparse market
  const qualified = scored.filter((c) => c.similarityScore >= 25);
  const compsForValuation = qualified.length >= 2 ? qualified : scored;

  const conditionFactor = getConditionFactor(subject.condition);
  const rawAdjusted = compsForValuation
    .map((c) => c.adjustedPrice)
    .filter((p): p is number => p !== null && p > 0);

  const conditioned = rawAdjusted.map((p) => Math.round(p * conditionFactor));
  const medianAdjusted = median(conditioned);

  let suggestedPrice: number | null = medianAdjusted;
  let priceLow: number | null = null;
  let priceHigh: number | null = null;

  if (conditioned.length >= 2) {
    const sorted = [...conditioned].sort((a, b) => a - b);
    priceLow = sorted[0];
    priceHigh = sorted[sorted.length - 1];
    // Tighten range toward median for suggested display
    if (medianAdjusted) {
      suggestedPrice = medianAdjusted;
    }
  } else if (conditioned.length === 1) {
    suggestedPrice = conditioned[0];
    priceLow = Math.round(conditioned[0] * 0.97);
    priceHigh = Math.round(conditioned[0] * 1.03);
  }

  return {
    scoredComps: scored,
    valuation: {
      suggestedPrice,
      priceLow,
      priceHigh,
      medianAdjustedPrice: medianAdjusted,
      compCount: compsForValuation.length,
      medianPricePerSqft: medianPpsf,
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
  const adjusted = activeComps
    .filter((c) => c.price && c.price > 0)
    .map((comp) => adjustComp(subject, comp, medianPpsf).adjustedPrice)
    .filter((p): p is number => p !== null);

  const conditioned = adjusted.map((p) => Math.round(p * conditionFactor));
  const medianAdjusted = median(conditioned);

  if (conditioned.length === 0) {
    return {
      suggestedPrice: null,
      priceLow: null,
      priceHigh: null,
      medianAdjustedPrice: null,
      compCount: 0,
      medianPricePerSqft: medianPpsf,
      conditionFactor,
    };
  }

  const sorted = [...conditioned].sort((a, b) => a - b);
  return {
    suggestedPrice: medianAdjusted,
    priceLow: sorted[0],
    priceHigh: sorted[sorted.length - 1],
    medianAdjustedPrice: medianAdjusted,
    compCount: conditioned.length,
    medianPricePerSqft: medianPpsf,
    conditionFactor,
  };
}

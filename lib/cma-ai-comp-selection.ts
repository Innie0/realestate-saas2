/**
 * Comparable selection for CMA valuation — similarity-ranked, closed sales first.
 */

import {
  isAskingPriceComp,
  LIST_TO_SALE_FACTOR,
  type ScoredComp,
  type SubjectProperty,
} from '@/lib/cma';
import { isActiveListingComp, normalizeAddress } from '@/lib/comp-filters';

const TARGET_SELECTED = 5;
const MIN_SELECTED = 2;
const STRONG_SCORE = 35;
/** Closed sales wanted before asking-price listings are used. */
const MIN_CLOSED_BEFORE_ASKING = 3;

export interface AiCompSelectionResult {
  selectedAddresses: Set<string>;
  rationale: string | null;
  aiUsed: boolean;
}

function compKey(comp: ScoredComp): string {
  return normalizeAddress(comp.address);
}

/**
 * Breezy-style selection: top similarity matches, closed sales first. Asking-price
 * comps (active or off-market listings) only fill in when closed sales are thin.
 */
export function selectCompsBySimilarity(
  scoredComps: ScoredComp[],
  options?: { includeActive?: boolean; maxSelected?: number },
): AiCompSelectionResult {
  const maxSelected = options?.maxSelected ?? TARGET_SELECTED;
  const includeActive = options?.includeActive !== false;

  if (scoredComps.length === 0) {
    return { selectedAddresses: new Set(), rationale: null, aiUsed: false };
  }

  const sorted = [...scoredComps].sort((a, b) => b.similarityScore - a.similarityScore);
  const strong = sorted.filter((c) => c.similarityScore >= STRONG_SCORE);
  const pool = strong.length >= MIN_SELECTED ? strong : sorted;

  const picked: ScoredComp[] = [];
  const pickedKeys = new Set<string>();

  const add = (comp: ScoredComp | undefined) => {
    if (!comp || picked.length >= maxSelected) return;
    const key = compKey(comp);
    if (!key || pickedKeys.has(key)) return;
    pickedKeys.add(key);
    picked.push(comp);
  };

  const closed = (c: ScoredComp) => !isAskingPriceComp(c);
  const allowed = (c: ScoredComp) => includeActive || !isActiveListingComp(c);

  for (const comp of pool) if (closed(comp)) add(comp);
  // Too few strong closed sales — take weaker closed sales before asking prices
  if (picked.length < MIN_CLOSED_BEFORE_ASKING) {
    for (const comp of sorted) {
      if (picked.length >= MIN_CLOSED_BEFORE_ASKING) break;
      if (closed(comp)) add(comp);
    }
  }
  if (picked.length < MIN_CLOSED_BEFORE_ASKING) {
    for (const comp of pool) if (allowed(comp)) add(comp);
  }
  if (picked.length < MIN_SELECTED) {
    for (const comp of sorted) {
      if (picked.length >= Math.min(maxSelected, MIN_SELECTED)) break;
      if (allowed(comp)) add(comp);
    }
  }

  const askingCount = picked.filter(isAskingPriceComp).length;
  const closedCount = picked.length - askingCount;

  let rationale = `${closedCount} closed sale${closedCount !== 1 ? 's' : ''} — top matches for this subject.`;
  if (closedCount === 0 && askingCount > 0) {
    rationale = `No closed sales with recorded prices matched — using ${askingCount} listing${askingCount !== 1 ? 's' : ''} at asking price less ${Math.round((1 - LIST_TO_SALE_FACTOR) * 100)}%.`;
  } else if (askingCount > 0) {
    rationale = `${closedCount} closed sale${closedCount !== 1 ? 's' : ''} plus ${askingCount} listing${askingCount !== 1 ? 's' : ''} (asking price less ${Math.round((1 - LIST_TO_SALE_FACTOR) * 100)}%) — closed sales were thin.`;
  }

  return {
    selectedAddresses: new Set(picked.map((c) => compKey(c)).filter(Boolean)),
    rationale,
    aiUsed: false,
  };
}

/** Similarity-ranked comp picks for upgrading stale cache. */
export function fallbackCompSelectionAddresses(scoredComps: ScoredComp[]): Set<string> {
  return selectCompsBySimilarity(scoredComps).selectedAddresses;
}

/** Pick the best comps for valuation — similarity-ranked, closed sales first. */
export async function selectBestCompsWithAI(
  _subject: SubjectProperty,
  _propertyType: string | null,
  scoredComps: ScoredComp[],
  options?: { includeActive?: boolean },
): Promise<AiCompSelectionResult> {
  if (scoredComps.length === 0) {
    return { selectedAddresses: new Set(), rationale: null, aiUsed: false };
  }

  return selectCompsBySimilarity(scoredComps, {
    includeActive: options?.includeActive !== false,
  });
}

export function addressesToSelectedComps(
  scoredComps: ScoredComp[],
  selectedAddresses: Set<string>,
): ScoredComp[] {
  return scoredComps.map((comp) => {
    const key = normalizeAddress(comp.address);
    return {
      ...comp,
      selectedForValuation: key ? selectedAddresses.has(key) : false,
    };
  });
}

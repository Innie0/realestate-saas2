/**
 * Comparable selection for CMA valuation — similarity-ranked with sold + active mix.
 */

import type { ScoredComp, SubjectProperty } from '@/lib/cma';
import { isActiveListingComp, normalizeAddress } from '@/lib/comp-filters';

const TARGET_SELECTED = 5;
const MIN_SELECTED = 2;
const STRONG_SCORE = 35;

export interface AiCompSelectionResult {
  selectedAddresses: Set<string>;
  rationale: string | null;
  aiUsed: boolean;
}

function compKey(comp: ScoredComp): string {
  return normalizeAddress(comp.address);
}

/**
 * Breezy-style selection: top similarity matches, ensuring sold + active mix when available.
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

  if (includeActive) {
    add(pool.find((c) => !isActiveListingComp(c)));
    add(pool.find((c) => isActiveListingComp(c)));
  }

  for (const comp of pool) {
    if (picked.length >= maxSelected) break;
    add(comp);
  }

  if (picked.length < MIN_SELECTED) {
    for (const comp of sorted) {
      if (picked.length >= Math.min(maxSelected, MIN_SELECTED)) break;
      add(comp);
    }
  }

  const soldCount = picked.filter((c) => !isActiveListingComp(c)).length;
  const activeCount = picked.length - soldCount;

  let rationale = `Selected ${picked.length} best-matching comp${picked.length !== 1 ? 's' : ''} by similarity`;
  if (includeActive && activeCount > 0 && soldCount > 0) {
    rationale = `${soldCount} closed sale${soldCount !== 1 ? 's' : ''} and ${activeCount} active listing${activeCount !== 1 ? 's' : ''} — top matches for this subject.`;
  } else if (activeCount > 0) {
    rationale = `${activeCount} active listing${activeCount !== 1 ? 's' : ''} included as market comps.`;
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

/** Pick the best comps for valuation — similarity-ranked with sold + active mix. */
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

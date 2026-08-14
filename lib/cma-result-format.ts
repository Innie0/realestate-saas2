/**
 * CMA result versioning — invalidates pre-AI-selection cache entries.
 */

import {
  addressesToSelectedComps,
  fallbackCompSelectionAddresses,
} from '@/lib/cma-ai-comp-selection';
import { valueFromSelectedComps, type ScoredComp, type SubjectProperty } from '@/lib/cma';

/** Bump when comp selection / valuation shape changes. */
export const CMA_RESULT_VERSION = 7;

export interface CmaResultLike {
  resultVersion?: number;
  subject: SubjectProperty;
  comps: ScoredComp[];
  valuation: {
    suggestedPrice: number | null;
    priceLow: number | null;
    priceHigh: number | null;
    medianAdjustedPrice: number | null;
    compCount: number;
    medianPricePerSqft: number | null;
    conditionFactor: number;
  };
  compSelectionNote?: string | null;
  compSelectionAiUsed?: boolean;
}

export function isStaleCmaResult(result: CmaResultLike | null | undefined): boolean {
  if (!result?.comps?.length) return false;
  if (result.resultVersion === CMA_RESULT_VERSION) return false;
  return !result.comps.some((comp) => comp.selectedForValuation === true);
}

/** Upgrade legacy cached results with similarity-based comp selection. */
export function upgradeCmaResult<T extends CmaResultLike>(result: T): T {
  if (!isStaleCmaResult(result)) {
    return result.resultVersion === CMA_RESULT_VERSION
      ? result
      : { ...result, resultVersion: CMA_RESULT_VERSION };
  }

  const selectedAddresses = fallbackCompSelectionAddresses(result.comps);
  const marked = addressesToSelectedComps(result.comps, selectedAddresses);
  const { scoredComps, valuation } = valueFromSelectedComps(result.subject, marked);

  return {
    ...result,
    comps: scoredComps,
    valuation,
    resultVersion: CMA_RESULT_VERSION,
    compSelectionNote:
      result.compSelectionNote ??
      'Best-match comps estimated from similarity scores. Re-run analysis for AI-selected comps.',
    compSelectionAiUsed: false,
  };
}

export function normalizeCmaResult<T extends CmaResultLike>(result: T): T {
  return isStaleCmaResult(result) ? upgradeCmaResult(result) : result;
}

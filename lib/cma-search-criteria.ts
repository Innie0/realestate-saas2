/**
 * Agent-controlled comp search criteria (Breezy-style filters).
 */

import type { SubjectProperty } from '@/lib/cma';
import { compAddressFromRaw, type ExcludedCompSummary } from '@/lib/comp-filters';

export interface CmaSearchCriteria {
  sqftEnabled: boolean;
  sqftMin: number | null;
  sqftMax: number | null;
  bedsEnabled: boolean;
  bedsMin: number | null;
  bedsMax: number | null;
  bathsEnabled: boolean;
  bathsMin: number | null;
  bathsMax: number | null;
  lotEnabled: boolean;
  lotMin: number | null;
  lotMax: number | null;
  yearBuiltEnabled: boolean;
  yearBuiltMin: number | null;
  yearBuiltMax: number | null;
}

export const SQFT_PRESET_PCTS = [5, 10, 15, 20, 25] as const;

export const MIN_COMPS_FOR_STRICT_SEARCH = 2;

function roundSqft(n: number): number {
  return Math.round(n / 10) * 10;
}

/** Sensible defaults from subject — visible and editable like Breezy. */
export function defaultSearchCriteriaFromSubject(subject: SubjectProperty): CmaSearchCriteria {
  const sqft = subject.squareFootage;
  const beds = subject.bedrooms;
  const baths = subject.bathrooms;
  const lot = subject.lotSize;
  const year = subject.yearBuilt;

  const sqftPct = 0.15;
  const lotPct = 0.35;

  return {
    sqftEnabled: sqft != null && sqft > 0,
    sqftMin: sqft != null && sqft > 0 ? roundSqft(sqft * (1 - sqftPct)) : null,
    sqftMax: sqft != null && sqft > 0 ? roundSqft(sqft * (1 + sqftPct)) : null,
    bedsEnabled: beds != null,
    bedsMin: beds != null ? Math.max(0, beds - 1) : null,
    bedsMax: beds != null ? beds + 1 : null,
    bathsEnabled: baths != null,
    bathsMin: baths != null ? Math.max(0, baths - 1) : null,
    bathsMax: baths != null ? baths + 1 : null,
    lotEnabled: false,
    lotMin: lot != null && lot > 0 ? Math.round(lot * (1 - lotPct)) : null,
    lotMax: lot != null && lot > 0 ? Math.round(lot * (1 + lotPct)) : null,
    yearBuiltEnabled: false,
    yearBuiltMin: year != null ? year - 15 : null,
    yearBuiltMax: year != null ? year + 5 : null,
  };
}

export function applySqftPreset(
  subjectSqft: number | null,
  pct: number,
  current: CmaSearchCriteria,
): CmaSearchCriteria {
  if (!subjectSqft || subjectSqft <= 0) return current;
  const factor = pct / 100;
  return {
    ...current,
    sqftEnabled: true,
    sqftMin: roundSqft(subjectSqft * (1 - factor)),
    sqftMax: roundSqft(subjectSqft * (1 + factor)),
  };
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function bool(v: unknown, fallback: boolean): boolean {
  if (typeof v === 'boolean') return v;
  return fallback;
}

/** Parse criteria from API request body with optional subject defaults. */
export function parseSearchCriteriaFromBody(
  body: Record<string, unknown>,
  subject: SubjectProperty,
): CmaSearchCriteria {
  const defaults = defaultSearchCriteriaFromSubject(subject);
  const raw = body.searchCriteria;
  if (!raw || typeof raw !== 'object') return defaults;

  const c = raw as Record<string, unknown>;
  return {
    sqftEnabled: bool(c.sqftEnabled, defaults.sqftEnabled),
    sqftMin: num(c.sqftMin) ?? defaults.sqftMin,
    sqftMax: num(c.sqftMax) ?? defaults.sqftMax,
    bedsEnabled: bool(c.bedsEnabled, defaults.bedsEnabled),
    bedsMin: num(c.bedsMin) ?? defaults.bedsMin,
    bedsMax: num(c.bedsMax) ?? defaults.bedsMax,
    bathsEnabled: bool(c.bathsEnabled, defaults.bathsEnabled),
    bathsMin: num(c.bathsMin) ?? defaults.bathsMin,
    bathsMax: num(c.bathsMax) ?? defaults.bathsMax,
    lotEnabled: bool(c.lotEnabled, defaults.lotEnabled),
    lotMin: num(c.lotMin) ?? defaults.lotMin,
    lotMax: num(c.lotMax) ?? defaults.lotMax,
    yearBuiltEnabled: bool(c.yearBuiltEnabled, defaults.yearBuiltEnabled),
    yearBuiltMin: num(c.yearBuiltMin) ?? defaults.yearBuiltMin,
    yearBuiltMax: num(c.yearBuiltMax) ?? defaults.yearBuiltMax,
  };
}

function inRange(
  value: number | null | undefined,
  min: number | null,
  max: number | null,
): boolean {
  if (value == null || !Number.isFinite(value)) return false;
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

export function getSearchCriteriaExclusionReason(
  raw: Record<string, unknown>,
  criteria: CmaSearchCriteria,
): string | null {
  const sqft = raw.squareFootage as number | undefined;
  if (criteria.sqftEnabled) {
    if (sqft && sqft > 0) {
      if (!inRange(sqft, criteria.sqftMin, criteria.sqftMax)) {
        const min = criteria.sqftMin?.toLocaleString() ?? '—';
        const max = criteria.sqftMax?.toLocaleString() ?? '—';
        return `Living area ${sqft.toLocaleString()} sqft outside ${min}–${max}`;
      }
    }
    // Missing sqft — keep comp (Rentcast often omits size on active listings)
  }

  const beds = raw.bedrooms as number | undefined;
  if (criteria.bedsEnabled && beds != null) {
    if (!inRange(beds, criteria.bedsMin, criteria.bedsMax)) {
      return `Bedrooms (${beds}) outside ${criteria.bedsMin ?? '—'}–${criteria.bedsMax ?? '—'}`;
    }
  }

  const baths = raw.bathrooms as number | undefined;
  if (criteria.bathsEnabled && baths != null) {
    if (!inRange(baths, criteria.bathsMin, criteria.bathsMax)) {
      return `Bathrooms (${baths}) outside ${criteria.bathsMin ?? '—'}–${criteria.bathsMax ?? '—'}`;
    }
  }

  const lot = raw.lotSize as number | undefined;
  if (criteria.lotEnabled) {
    if (!lot || lot <= 0) return 'Missing lot size';
    if (!inRange(lot, criteria.lotMin, criteria.lotMax)) {
      return `Lot size outside selected range`;
    }
  }

  const year = raw.yearBuilt as number | undefined;
  if (criteria.yearBuiltEnabled) {
    if (year == null) return 'Missing year built';
    if (!inRange(year, criteria.yearBuiltMin, criteria.yearBuiltMax)) {
      return `Year built (${year}) outside ${criteria.yearBuiltMin ?? '—'}–${criteria.yearBuiltMax ?? '—'}`;
    }
  }

  return null;
}

export function filterCompsBySearchCriteria(
  rawComps: Record<string, unknown>[],
  criteria: CmaSearchCriteria,
): { qualified: Record<string, unknown>[]; excluded: ExcludedCompSummary[] } {
  const qualified: Record<string, unknown>[] = [];
  const excluded: ExcludedCompSummary[] = [];

  for (const raw of rawComps) {
    const reason = getSearchCriteriaExclusionReason(raw, criteria);
    if (reason) {
      excluded.push({
        address: compAddressFromRaw(raw),
        reason,
        price: typeof raw.price === 'number' ? raw.price : null,
        squareFootage: typeof raw.squareFootage === 'number' ? raw.squareFootage : null,
        bedrooms: typeof raw.bedrooms === 'number' ? raw.bedrooms : null,
        bathrooms: typeof raw.bathrooms === 'number' ? raw.bathrooms : null,
        category: 'similarity',
      });
    } else {
      qualified.push(raw);
    }
  }

  return { qualified, excluded };
}

/** Stable suffix for cache keys when criteria change. */
export function searchCriteriaCacheSuffix(criteria: CmaSearchCriteria): string {
  const parts = [
    criteria.sqftEnabled ? `sq${criteria.sqftMin ?? ''}-${criteria.sqftMax ?? ''}` : 'sq0',
    criteria.bedsEnabled ? `bd${criteria.bedsMin ?? ''}-${criteria.bedsMax ?? ''}` : 'bd0',
    criteria.bathsEnabled ? `ba${criteria.bathsMin ?? ''}-${criteria.bathsMax ?? ''}` : 'ba0',
    criteria.lotEnabled ? `lt${criteria.lotMin ?? ''}-${criteria.lotMax ?? ''}` : 'lt0',
    criteria.yearBuiltEnabled
      ? `yr${criteria.yearBuiltMin ?? ''}-${criteria.yearBuiltMax ?? ''}`
      : 'yr0',
  ];
  return parts.join('_');
}

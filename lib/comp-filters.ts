import type { SubjectProperty } from '@/lib/cma';

/**
 * Sanitize comparable sales from MLS/listing feeds.
 * Filters out the subject property, active listings mislabeled as sold,
 * and invalid sale dates.
 */

const DIRECTION_MAP: Record<string, string> = {
  n: 'north',
  s: 'south',
  e: 'east',
  w: 'west',
  ne: 'northeast',
  nw: 'northwest',
  se: 'southeast',
  sw: 'southwest',
};

const SUFFIX_MAP: Record<string, string> = {
  st: 'street',
  street: 'street',
  ave: 'avenue',
  av: 'avenue',
  avenue: 'avenue',
  blvd: 'boulevard',
  boulevard: 'boulevard',
  dr: 'drive',
  drive: 'drive',
  rd: 'road',
  road: 'road',
  ln: 'lane',
  lane: 'lane',
  ct: 'court',
  court: 'court',
  cir: 'circle',
  circle: 'circle',
  pl: 'place',
  place: 'place',
  way: 'way',
  pkwy: 'parkway',
  parkway: 'parkway',
};

/** Normalize an address string for equality checks. */
export function normalizeAddress(addr: string): string {
  if (!addr) return '';

  const line = addr.split(',')[0].trim().toLowerCase();
  const tokens = line
    .replace(/[.#]/g, '')
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean);

  const normalized = tokens.map((token) => {
    const bare = token.replace(/[^a-z0-9]/g, '');
    if (DIRECTION_MAP[bare]) return DIRECTION_MAP[bare];
    if (SUFFIX_MAP[bare]) return SUFFIX_MAP[bare];
    return bare;
  });

  return normalized.join(' ');
}

export interface ExcludedCompSummary {
  address: string;
  reason: string;
  price: number | null;
  squareFootage: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  category: 'invalid' | 'similarity';
}

export interface SubjectSimilarityOptions {
  maxSqftPctDiff?: number;
  maxBedDiff?: number;
  maxBathDiff?: number;
  requirePropertyTypeMatch?: boolean;
  subjectPropertyType?: string | null;
}

const DEFAULT_SIMILARITY: Required<Omit<SubjectSimilarityOptions, 'subjectPropertyType'>> & {
  subjectPropertyType: string | null;
} = {
  maxSqftPctDiff: 0.22,
  maxBedDiff: 1,
  maxBathDiff: 1,
  requirePropertyTypeMatch: false,
  subjectPropertyType: null,
};

function normalizePropertyType(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  return value.trim().toLowerCase();
}

export function getSubjectSimilarityExclusionReason(
  raw: Record<string, unknown>,
  subject: SubjectProperty,
  options: SubjectSimilarityOptions = {},
): string | null {
  const opts = { ...DEFAULT_SIMILARITY, ...options };
  const subjectType = normalizePropertyType(opts.subjectPropertyType);
  const compType = normalizePropertyType(raw.propertyType as string | undefined);

  if (
    opts.requirePropertyTypeMatch &&
    subjectType &&
    compType &&
    subjectType !== compType &&
    !subjectType.includes(compType) &&
    !compType.includes(subjectType)
  ) {
    return 'Different property type';
  }

  const compSqft = raw.squareFootage as number | undefined;
  if (subject.squareFootage && compSqft && compSqft > 0) {
    const pct = Math.abs(subject.squareFootage - compSqft) / subject.squareFootage;
    if (pct > opts.maxSqftPctDiff) {
      return `Living area differs by ${Math.round(pct * 100)}% (>${Math.round(opts.maxSqftPctDiff * 100)}% limit)`;
    }
  }

  const compBeds = raw.bedrooms as number | undefined;
  if (subject.bedrooms != null && compBeds != null) {
    if (Math.abs(subject.bedrooms - compBeds) > opts.maxBedDiff) {
      return `Bedroom count off by ${Math.abs(subject.bedrooms - compBeds)}`;
    }
  }

  const compBaths = raw.bathrooms as number | undefined;
  if (subject.bathrooms != null && compBaths != null) {
    if (Math.abs(subject.bathrooms - compBaths) > opts.maxBathDiff) {
      return `Bathroom count off by ${Math.abs(subject.bathrooms - compBaths).toFixed(1)}`;
    }
  }

  return null;
}

export function filterCompsBySubjectSimilarity(
  rawComps: Record<string, unknown>[],
  subject: SubjectProperty,
  options: SubjectSimilarityOptions = {},
): { qualified: Record<string, unknown>[]; excluded: ExcludedCompSummary[] } {
  const qualified: Record<string, unknown>[] = [];
  const excluded: ExcludedCompSummary[] = [];

  for (const raw of rawComps) {
    const reason = getSubjectSimilarityExclusionReason(raw, subject, options);
    if (reason) {
      excluded.push(summarizeExcludedRaw(raw, reason, 'similarity'));
    } else {
      qualified.push(raw);
    }
  }

  return { qualified, excluded };
}

function summarizeExcludedRaw(
  raw: Record<string, unknown>,
  reason: string,
  category: ExcludedCompSummary['category'],
): ExcludedCompSummary {
  return {
    address: compAddressFromRaw(raw),
    reason,
    price: typeof raw.price === 'number' ? raw.price : null,
    squareFootage: typeof raw.squareFootage === 'number' ? raw.squareFootage : null,
    bedrooms: typeof raw.bedrooms === 'number' ? raw.bedrooms : null,
    bathrooms: typeof raw.bathrooms === 'number' ? raw.bathrooms : null,
    category,
  };
}

export function summarizeInvalidExcluded(
  excluded: { raw: Record<string, unknown>; reason: string }[],
): ExcludedCompSummary[] {
  return excluded.map(({ raw, reason }) => summarizeExcludedRaw(raw, reason, 'invalid'));
}

export function isSameAddress(a: string, b: string): boolean {
  if (!a || !b) return false;
  return normalizeAddress(a) === normalizeAddress(b);
}

/** Human-readable MLS/listing status for comp display. */
export function formatListingStatus(status: string | null | undefined): string {
  if (!status?.trim()) return 'Closed';
  const s = status.toLowerCase();
  if (s === 'sold' || s === 'closed' || s === 'inactive') return 'Sold';
  if (s === 'pending') return 'Pending';
  if (s.includes('contingent')) return 'Contingent';
  if (s.includes('under contract')) return 'Under contract';
  if (s === 'active') return 'Active';
  return status;
}

function isNonClosedStatus(status: string): boolean {
  return (
    status === 'active' ||
    status === 'pending' ||
    status.includes('coming') ||
    status.includes('contingent') ||
    status.includes('under contract')
  );
}

function parseDate(value: unknown): Date | null {
  if (!value || typeof value !== 'string') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Extract a comp address string from a Rentcast listing record. */
export function compAddressFromRaw(raw: Record<string, unknown>): string {
  return (
    (raw.formattedAddress as string) ||
    [raw.addressLine1, raw.city, raw.state].filter(Boolean).join(', ')
  );
}

/**
 * Resolve the best sold/closed date from a listing record.
 * Never use listedDate for active/pending listings — that is the list date, not a sale.
 */
export function extractSoldDate(raw: Record<string, unknown>): string | null {
  const status = String(raw.status ?? '').toLowerCase();

  if (isNonClosedStatus(status)) {
    return null;
  }

  const saleDate =
    parseDate(raw.lastSaleDate) ||
    parseDate(raw.soldDate) ||
    parseDate(raw.removedDate) ||
    parseDate(raw.closedDate);

  if (saleDate) {
    return saleDate.toISOString();
  }

  // Only use listedDate when the record is explicitly sold/closed/inactive
  if (status === 'sold' || status === 'closed' || status === 'inactive') {
    const listed = parseDate(raw.listedDate);
    if (listed) return listed.toISOString();
  }

  return null;
}

export interface CompFilterOptions {
  subjectAddress: string;
  /** Addresses known to be actively listed (subject + optional others) */
  activeListingAddresses?: string[];
  /** MLS numbers for active listings at the subject */
  activeMlsNumbers?: string[];
}

export interface CompFilterResult {
  included: Record<string, unknown>[];
  excluded: { raw: Record<string, unknown>; reason: string }[];
}

/**
 * Determine whether a raw Rentcast listing is a valid sold comp.
 */
export function getCompExclusionReason(
  raw: Record<string, unknown>,
  options: CompFilterOptions
): string | null {
  const compAddr = compAddressFromRaw(raw);
  const status = String(raw.status ?? '').toLowerCase();

  if (isSameAddress(compAddr, options.subjectAddress)) {
    return 'Same property as subject';
  }

  for (const activeAddr of options.activeListingAddresses ?? []) {
    if (isSameAddress(compAddr, activeAddr)) {
      return 'Property is currently listed for sale';
    }
  }

  const mls = raw.mlsNumber ? String(raw.mlsNumber) : null;
  if (mls && options.activeMlsNumbers?.includes(mls)) {
    return 'MLS listing is currently active';
  }

  if (isNonClosedStatus(status)) {
    return 'Listing is not a closed sale';
  }

  const soldDate = extractSoldDate(raw);
  if (!soldDate) {
    return 'No verified sale date';
  }

  const sold = new Date(soldDate);
  const now = new Date();
  if (sold > now) {
    return 'Sale date is in the future (data error)';
  }

  // Same location, zero distance — likely the subject or duplicate record
  const distance = typeof raw.distance === 'number' ? raw.distance : null;
  if (distance !== null && distance < 0.02) {
    const subjectKey = normalizeAddress(options.subjectAddress);
    const compKey = normalizeAddress(compAddr);
    if (subjectKey && compKey && subjectKey === compKey) {
      return 'Same property as subject';
    }
  }

  if (!raw.price || Number(raw.price) <= 0) {
    return 'Missing sale price';
  }

  return null;
}

/** Filter raw Rentcast comp records to valid sold comparables only. */
export function filterSoldComps(
  rawComps: Record<string, unknown>[],
  options: CompFilterOptions
): CompFilterResult {
  const included: Record<string, unknown>[] = [];
  const excluded: { raw: Record<string, unknown>; reason: string }[] = [];

  for (const raw of rawComps) {
    const reason = getCompExclusionReason(raw, options);
    if (reason) {
      excluded.push({ raw, reason });
    } else {
      included.push(raw);
    }
  }

  return { included, excluded };
}

/** Map a validated raw Rentcast record to our comp shape. */
export function mapRawComp(raw: Record<string, unknown>) {
  const soldDate = extractSoldDate(raw);
  const price = raw.price as number;
  const squareFootage = raw.squareFootage as number | undefined;
  const latitude = typeof raw.latitude === 'number' ? raw.latitude : null;
  const longitude = typeof raw.longitude === 'number' ? raw.longitude : null;

  return {
    address: compAddressFromRaw(raw),
    propertyType: (raw.propertyType as string) ?? null,
    price: price ?? null,
    bedrooms: (raw.bedrooms as number) ?? null,
    bathrooms: (raw.bathrooms as number) ?? null,
    squareFootage: squareFootage ?? null,
    pricePerSqft:
      price && squareFootage ? Math.round(price / squareFootage) : null,
    daysOnMarket: (raw.daysOnMarket as number) ?? null,
    soldDate,
    distance: (raw.distance as number) ?? null,
    latitude,
    longitude,
    mlsNumber: (raw.mlsNumber as string) ?? null,
    listingStatus: raw.status ? String(raw.status) : null,
  };
}

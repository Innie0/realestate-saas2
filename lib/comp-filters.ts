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

export function isSameAddress(a: string, b: string): boolean {
  if (!a || !b) return false;
  return normalizeAddress(a) === normalizeAddress(b);
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
  const status = String(raw.status ?? 'Sold').toLowerCase();

  if (status === 'active' || status === 'pending' || status.includes('coming')) {
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
  const status = String(raw.status ?? 'Sold').toLowerCase();

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

  if (status === 'active' || status === 'pending' || status.includes('coming')) {
    return 'Listing is active, not sold';
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
    listingStatus: String(raw.status ?? 'Sold'),
  };
}

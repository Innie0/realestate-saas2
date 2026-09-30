/**
 * Rentcast comparable sales fetching with sparse-market fallback.
 *
 * Closed sales come from public property records (`/properties`), which carry the
 * recorded sale price. The `/listings/sale` endpoint only knows asking prices and
 * ignores `status=Sold` (it silently returns active listings), so it is used only
 * for active comps and as an off-market fallback in non-disclosure states.
 */

const RENTCAST_BASE = 'https://api.rentcast.io/v1';
const DEFAULT_LIMIT = 100;
const MIN_RAW_COMPS = 8;
/** Below this many recorded sales we top up with recently off-market listings. */
const MIN_RECORDED_SALES = 5;

export type CompPriceSource = 'recorded_sale' | 'last_list_price' | 'active_list_price';

export interface FetchCompsParams {
  /** Full subject address (used when coordinates are unavailable). */
  address: string;
  apiKey: string;
  propertyType?: string;
  radius: number;
  daysOld: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface FetchCompsResult {
  raw: Record<string, unknown>[];
  radiusUsed: number;
  daysOldUsed: number;
  widenedSearch: boolean;
  /** Recorded sales found (before validity filtering). */
  recordedSaleCount: number;
  /** Off-market listings added because recorded sales were thin. */
  offMarketCount: number;
}

function hasCoords(params: FetchCompsParams): boolean {
  return (
    typeof params.latitude === 'number' &&
    typeof params.longitude === 'number' &&
    Number.isFinite(params.latitude) &&
    Number.isFinite(params.longitude)
  );
}

/** Great-circle distance in miles. */
export function distanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function rentcastGet(
  path: string,
  search: URLSearchParams,
  apiKey: string,
): Promise<Record<string, unknown>[]> {
  try {
    const res = await fetch(`${RENTCAST_BASE}${path}?${search}`, {
      headers: { 'X-Api-Key': apiKey, Accept: 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : (data?.listings ?? []);
  } catch {
    return [];
  }
}

/**
 * Convert a Rentcast property record into the listing-shaped raw comp the rest of
 * the pipeline expects (status, price, soldDate, distance, features).
 */
export function rawCompFromPropertyRecord(
  record: Record<string, unknown>,
  subject?: { latitude?: number | null; longitude?: number | null },
): Record<string, unknown> {
  const features =
    record.features && typeof record.features === 'object'
      ? (record.features as Record<string, unknown>)
      : null;
  const distance =
    typeof record.distance === 'number' ? record.distance : distanceFromSubject(record, subject ?? {});

  return {
    ...record,
    status: 'Sold',
    price: typeof record.lastSalePrice === 'number' ? record.lastSalePrice : null,
    soldDate: record.lastSaleDate ?? null,
    distance,
    hasPool: typeof features?.pool === 'boolean' ? features.pool : null,
    garageSpaces:
      typeof features?.garageSpaces === 'number'
        ? features.garageSpaces
        : features?.garage === false
          ? 0
          : null,
    priceSource: 'recorded_sale' satisfies CompPriceSource,
  };
}

/** Recently sold properties from public records (actual recorded sale prices). */
export async function fetchRecordedSales(
  params: FetchCompsParams & { limit?: number },
): Promise<Record<string, unknown>[]> {
  if (!hasCoords(params)) return [];
  const search = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    radius: String(params.radius),
    saleDateRange: String(Math.max(1, Math.round(params.daysOld))),
    limit: String(params.limit ?? DEFAULT_LIMIT),
  });
  if (params.propertyType) search.set('propertyType', params.propertyType);

  const records = await rentcastGet('/properties', search, params.apiKey);
  return records.map((r) =>
    rawCompFromPropertyRecord(r, { latitude: params.latitude, longitude: params.longitude }),
  );
}

/**
 * Recently removed listings, used only when public records have no sale prices
 * (non-disclosure states). Their price is the last asking price, not a sale price.
 */
async function fetchOffMarketListings(
  params: FetchCompsParams,
): Promise<Record<string, unknown>[]> {
  const search = new URLSearchParams({
    status: 'Inactive',
    limit: '50',
    radius: String(params.radius),
  });
  if (hasCoords(params)) {
    search.set('latitude', String(params.latitude));
    search.set('longitude', String(params.longitude));
  } else {
    search.set('address', params.address);
  }
  if (params.propertyType) search.set('propertyType', params.propertyType);

  const raw = await rentcastGet('/listings/sale', search, params.apiKey);
  const cutoff = Date.now() - params.daysOld * 86_400_000;

  return raw
    .filter((r) => {
      const removed = typeof r.removedDate === 'string' ? Date.parse(r.removedDate) : NaN;
      const type = String(r.listingType ?? 'Standard').toLowerCase();
      // Skip builder inventory and distressed sales — asking price is a poor sale proxy
      return Number.isFinite(removed) && removed >= cutoff && type === 'standard';
    })
    .map((r) => ({
      ...r,
      distance: r.distance ?? distanceFromSubject(r, params),
      status: 'Off market',
      soldDate: r.removedDate,
      priceSource: 'last_list_price' satisfies CompPriceSource,
    }));
}

async function fetchSoldPool(params: FetchCompsParams) {
  const recorded = await fetchRecordedSales(params);
  const recordedWithPrice = recorded.filter(
    (r) => typeof r.price === 'number' && (r.price as number) > 0,
  );

  let offMarket: Record<string, unknown>[] = [];
  if (recordedWithPrice.length < MIN_RECORDED_SALES) {
    offMarket = await fetchOffMarketListings(params);
  }

  return {
    raw: [...recorded, ...offMarket],
    recordedSaleCount: recordedWithPrice.length,
    offMarketCount: offMarket.length,
    usable: recordedWithPrice.length + offMarket.length,
  };
}

/** Fetch closed comps; widen radius/timeframe once if the market is sparse. */
export async function fetchCompsWithFallback(params: FetchCompsParams): Promise<FetchCompsResult> {
  let pool = await fetchSoldPool(params);
  let radiusUsed = params.radius;
  let daysOldUsed = params.daysOld;
  let widenedSearch = false;

  if (pool.usable < MIN_RAW_COMPS) {
    const widerRadius = Math.min(params.radius * 2, 2);
    const widerDays = Math.min(Math.round(params.daysOld * 1.5), 1095);
    if (widerRadius > params.radius || widerDays > params.daysOld) {
      const retry = await fetchSoldPool({ ...params, radius: widerRadius, daysOld: widerDays });
      if (retry.usable > pool.usable) {
        pool = retry;
        radiusUsed = widerRadius;
        daysOldUsed = widerDays;
        widenedSearch = true;
      }
    }
  }

  return {
    raw: pool.raw,
    radiusUsed,
    daysOldUsed,
    widenedSearch,
    recordedSaleCount: pool.recordedSaleCount,
    offMarketCount: pool.offMarketCount,
  };
}

/** Fetch nearby active listings as market comps (Breezy-style). */
export async function fetchActiveCompsNear(
  params: Omit<FetchCompsParams, 'daysOld'>,
): Promise<Record<string, unknown>[]> {
  const search = new URLSearchParams({
    status: 'Active',
    limit: '25',
    radius: String(params.radius),
  });
  if (
    typeof params.latitude === 'number' &&
    typeof params.longitude === 'number'
  ) {
    search.set('latitude', String(params.latitude));
    search.set('longitude', String(params.longitude));
  } else {
    search.set('address', params.address);
  }
  if (params.propertyType) search.set('propertyType', params.propertyType);

  const raw = await rentcastGet('/listings/sale', search, params.apiKey);
  return raw.map((r) => ({
    ...r,
    distance: r.distance ?? distanceFromSubject(r, params),
    priceSource: 'active_list_price' satisfies CompPriceSource,
  }));
}

function distanceFromSubject(
  raw: Record<string, unknown>,
  subject: { latitude?: number | null; longitude?: number | null },
): number | null {
  if (
    typeof raw.latitude !== 'number' ||
    typeof raw.longitude !== 'number' ||
    typeof subject.latitude !== 'number' ||
    typeof subject.longitude !== 'number'
  ) {
    return null;
  }
  return (
    Math.round(
      distanceMiles(subject.latitude, subject.longitude, raw.latitude, raw.longitude) * 100,
    ) / 100
  );
}

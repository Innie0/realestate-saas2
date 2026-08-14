/**
 * Rentcast comparable sales fetching with sparse-market fallback.
 */

const RENTCAST_BASE = 'https://api.rentcast.io/v1';
const DEFAULT_LIMIT = 50;
const MIN_RAW_COMPS = 8;

export interface FetchCompsParams {
  address: string;
  apiKey: string;
  propertyType?: string;
  radius: number;
  daysOld: number;
}

export interface FetchCompsResult {
  raw: Record<string, unknown>[];
  radiusUsed: number;
  daysOldUsed: number;
  widenedSearch: boolean;
}

async function fetchCompsPage(
  params: FetchCompsParams & { limit: number },
): Promise<Record<string, unknown>[]> {
  const search = new URLSearchParams({
    address: params.address,
    status: 'Sold',
    limit: String(params.limit),
    radius: String(params.radius),
    daysOld: String(params.daysOld),
  });
  if (params.propertyType) search.set('propertyType', params.propertyType);

  const res = await fetch(`${RENTCAST_BASE}/listings/sale?${search}`, {
    headers: { 'X-Api-Key': params.apiKey, Accept: 'application/json' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.listings ?? []);
}

/** Fetch sold comps; widen radius/timeframe once if the market is sparse. */
export async function fetchCompsWithFallback(params: FetchCompsParams): Promise<FetchCompsResult> {
  let raw = await fetchCompsPage({ ...params, limit: DEFAULT_LIMIT });
  let radiusUsed = params.radius;
  let daysOldUsed = params.daysOld;
  let widenedSearch = false;

  if (raw.length < MIN_RAW_COMPS) {
    const widerRadius = Math.min(params.radius * 2, 2);
    const widerDays = Math.min(Math.round(params.daysOld * 1.5), 1095);
    if (widerRadius > params.radius || widerDays > params.daysOld) {
      const retry = await fetchCompsPage({
        ...params,
        radius: widerRadius,
        daysOld: widerDays,
        limit: DEFAULT_LIMIT,
      });
      if (retry.length > raw.length) {
        raw = retry;
        radiusUsed = widerRadius;
        daysOldUsed = widerDays;
        widenedSearch = true;
      }
    }
  }

  return { raw, radiusUsed, daysOldUsed, widenedSearch };
}

/** Fetch nearby active listings as market comps (Breezy-style). */
export async function fetchActiveCompsNear(
  params: Omit<FetchCompsParams, 'daysOld'>,
): Promise<Record<string, unknown>[]> {
  const search = new URLSearchParams({
    address: params.address,
    status: 'Active',
    limit: '25',
    radius: String(params.radius),
  });
  if (params.propertyType) search.set('propertyType', params.propertyType);

  const res = await fetch(`${RENTCAST_BASE}/listings/sale?${search}`, {
    headers: { 'X-Api-Key': params.apiKey, Accept: 'application/json' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.listings ?? []);
}

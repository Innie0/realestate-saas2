/**
 * Look up a single sold property by address (for manual comp add).
 * Uses public property records, which carry the recorded sale price.
 */

import { rawCompFromPropertyRecord } from '@/lib/comp-fetch';

const RENTCAST_BASE = 'https://api.rentcast.io/v1';

export async function fetchSoldListingsByAddress(
  address: string,
  apiKey: string,
  subjectCoords?: { latitude?: number | null; longitude?: number | null },
): Promise<Record<string, unknown>[]> {
  const search = new URLSearchParams({ address: address.trim() });

  const res = await fetch(`${RENTCAST_BASE}/properties?${search}`, {
    headers: { 'X-Api-Key': apiKey, Accept: 'application/json' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const records: Record<string, unknown>[] = Array.isArray(data) ? data : data ? [data] : [];
  return records.map((r) => rawCompFromPropertyRecord(r, subjectCoords));
}

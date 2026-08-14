/**
 * Look up a single sold listing by address (for manual comp add).
 */

const RENTCAST_BASE = 'https://api.rentcast.io/v1';

export async function fetchSoldListingsByAddress(
  address: string,
  apiKey: string,
  limit = 5,
): Promise<Record<string, unknown>[]> {
  const search = new URLSearchParams({
    address: address.trim(),
    status: 'Sold',
    limit: String(limit),
  });

  const res = await fetch(`${RENTCAST_BASE}/listings/sale?${search}`, {
    headers: { 'X-Api-Key': apiKey, Accept: 'application/json' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : (data?.listings ?? []);
}

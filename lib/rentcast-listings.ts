const RENTCAST_BASE = 'https://api.rentcast.io/v1';

export type RentcastSaleListing = {
  formattedAddress?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
  status?: string;
  removedDate?: string | null;
  lastSeenDate?: string | null;
};

export type RentcastPropertyRecord = {
  bedrooms?: number;
  bathrooms?: number;
  squareFootage?: number;
};

function getRentcastKey() {
  return process.env.RENTCAST_API_KEY || null;
}

export function buildRentcastAddress(
  street: string,
  city: string,
  state: string,
  zip: string
): string {
  const parts = [street];
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (zip) parts.push(zip);
  return parts.join(', ');
}

async function fetchRentcastSaleListing(
  fullAddress: string,
  status: 'Active' | 'Inactive'
): Promise<RentcastSaleListing | null> {
  const key = getRentcastKey();
  if (!key) return null;

  try {
    const params = new URLSearchParams({ address: fullAddress, status, limit: '1' });
    const res = await fetch(`${RENTCAST_BASE}/listings/sale?${params}`, {
      headers: { 'X-Api-Key': key, Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? (data[0] as RentcastSaleListing) : null;
  } catch {
    return null;
  }
}

export async function fetchRentcastActiveListing(
  street: string,
  city: string,
  state: string,
  zip: string
): Promise<RentcastSaleListing | null> {
  const fullAddress = buildRentcastAddress(street, city, state, zip);
  return fetchRentcastSaleListing(fullAddress, 'Active');
}

export async function fetchRentcastInactiveListing(
  street: string,
  city: string,
  state: string,
  zip: string
): Promise<RentcastSaleListing | null> {
  const fullAddress = buildRentcastAddress(street, city, state, zip);
  return fetchRentcastSaleListing(fullAddress, 'Inactive');
}

/** County/property record — fallback when listing omits beds/baths/sq ft. */
export async function fetchRentcastProperty(
  street: string,
  city: string,
  state: string,
  zip: string
): Promise<RentcastPropertyRecord | null> {
  const key = getRentcastKey();
  if (!key) return null;

  const fullAddress = buildRentcastAddress(street, city, state, zip);

  try {
    const params = new URLSearchParams({ address: fullAddress, limit: '1' });
    const res = await fetch(`${RENTCAST_BASE}/properties?${params}`, {
      headers: { 'X-Api-Key': key, Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const record = data[0] as RentcastPropertyRecord;
    return record;
  } catch {
    return null;
  }
}

export function isRentcastConfigured(): boolean {
  return Boolean(getRentcastKey());
}

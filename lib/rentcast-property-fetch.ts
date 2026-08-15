const RENTCAST_BASE = 'https://api.rentcast.io/v1';

export interface RentcastAddressFields {
  street: string;
  city: string;
  state: string;
  zip: string;
}

function buildRentcastAddress(fields: RentcastAddressFields, street = fields.street): string {
  const parts = [street.trim()];
  if (fields.city.trim()) parts.push(fields.city.trim());
  parts.push(fields.state.trim());
  if (fields.zip.trim()) parts.push(fields.zip.trim());
  return parts.join(', ');
}

/** Generate common street-line variants (Mapbox often differs from county records). */
export function rentcastStreetVariants(street: string): string[] {
  const base = street.trim();
  if (!base) return [];

  const variants = new Set<string>([base]);

  const directionReplacements: [RegExp, string][] = [
    [/\bWest\b/gi, 'W'],
    [/\bEast\b/gi, 'E'],
    [/\bNorth\b/gi, 'N'],
    [/\bSouth\b/gi, 'S'],
  ];

  const suffixReplacements: [RegExp, string][] = [
    [/\bAvenue\b/gi, 'Dr'],
    [/\bAve\.?\b/gi, 'Dr'],
    [/\bDrive\b/gi, 'Dr'],
    [/\bStreet\b/gi, 'St'],
    [/\bSt\.?\b/gi, 'St'],
    [/\bRoad\b/gi, 'Rd'],
    [/\bRd\.?\b/gi, 'Rd'],
    [/\bLane\b/gi, 'Ln'],
    [/\bCourt\b/gi, 'Ct'],
    [/\bBoulevard\b/gi, 'Blvd'],
  ];

  const expand = (input: string) => {
    variants.add(input.replace(/\s+/g, ' ').trim());
    for (const [pattern, replacement] of directionReplacements) {
      variants.add(input.replace(pattern, replacement).replace(/\s+/g, ' ').trim());
    }
  };

  expand(base);

  for (const current of [...variants]) {
    for (const [pattern, replacement] of suffixReplacements) {
      variants.add(current.replace(pattern, replacement).replace(/\s+/g, ' ').trim());
    }
    for (const [pattern, replacement] of directionReplacements) {
      const next = current.replace(pattern, replacement);
      for (const [suffixPattern, suffixReplacement] of suffixReplacements) {
        variants.add(next.replace(suffixPattern, suffixReplacement).replace(/\s+/g, ' ').trim());
      }
    }
  }

  return [...variants].filter(Boolean);
}

export function rentcastAddressVariants(fields: RentcastAddressFields): string[] {
  const streets = rentcastStreetVariants(fields.street);
  const addresses = streets.map((street) => buildRentcastAddress(fields, street));
  return [...new Set(addresses)];
}

async function queryRentcastProperty(
  apiKey: string,
  address: string,
): Promise<Record<string, unknown> | null> {
  const params = new URLSearchParams({ address, limit: '1' });
  const response = await fetch(`${RENTCAST_BASE}/properties?${params.toString()}`, {
    method: 'GET',
    headers: {
      'X-Api-Key': apiKey,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) return null;

  const data = await response.json();
  return Array.isArray(data) && data.length > 0 ? (data[0] as Record<string, unknown>) : null;
}

/** Try the typed address first, then common street variants until Rentcast matches. */
export async function fetchRentcastPropertyWithFallback(
  fields: RentcastAddressFields,
  apiKey = process.env.RENTCAST_API_KEY,
): Promise<Record<string, unknown> | null> {
  if (!apiKey) return null;

  for (const address of rentcastAddressVariants(fields)) {
    try {
      const property = await queryRentcastProperty(apiKey, address);
      if (property) return property;
    } catch {
      /* try next variant */
    }
  }

  return null;
}

export { buildRentcastAddress };

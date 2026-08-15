import type { ParsedAddress } from '@/lib/search/parse-address';

export interface AddressSuggestion extends ParsedAddress {
  id: string;
  /** Street line only — used for bold display like Breezy */
  streetLabel: string;
}

interface SearchBoxContextEntry {
  name?: string;
  region_code?: string;
  address_number?: string;
  street_name?: string;
}

interface SearchBoxSuggestion {
  mapbox_id: string;
  name: string;
  feature_type: string;
  address?: string;
  full_address?: string;
  context?: {
    place?: SearchBoxContextEntry;
    region?: SearchBoxContextEntry;
    postcode?: SearchBoxContextEntry;
    address?: SearchBoxContextEntry;
  };
}

const STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
  'district of columbia': 'DC',
};

export function getMapboxToken(): string | null {
  return (
    process.env.MAPBOX_ACCESS_TOKEN ||
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    null
  );
}

function normalizeState(value: string): string {
  const trimmed = value.trim();
  if (/^[A-Z]{2}$/i.test(trimmed)) return trimmed.toUpperCase();
  return STATE_NAME_TO_CODE[trimmed.toLowerCase()] ?? trimmed.toUpperCase();
}

function parseTailSegment(tail: string): { city: string; state: string; zip: string } | null {
  const stateZip = tail.match(/^(.+?)\s+([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/);
  if (stateZip) {
    return {
      city: stateZip[1].replace(/,\s*$/, '').trim(),
      state: stateZip[2].toUpperCase(),
      zip: stateZip[3],
    };
  }

  const stateOnly = tail.match(/^(.+?)\s+([A-Za-z]{2})$/);
  if (stateOnly) {
    return {
      city: stateOnly[1].replace(/,\s*$/, '').trim(),
      state: stateOnly[2].toUpperCase(),
      zip: '',
    };
  }

  const fullStateZip = tail.match(/^(.+?)\s+([A-Za-z .]+)\s+(\d{5}(?:-\d{4})?)$/);
  if (fullStateZip) {
    const state = normalizeState(fullStateZip[2]);
    if (/^[A-Z]{2}$/.test(state)) {
      return {
        city: fullStateZip[1].replace(/,\s*$/, '').trim(),
        state,
        zip: fullStateZip[3],
      };
    }
  }

  return null;
}

function parseSearchBoxSuggestion(suggestion: SearchBoxSuggestion): AddressSuggestion | null {
  if (!['address', 'poi'].includes(suggestion.feature_type)) return null;

  const ctx = suggestion.context ?? {};
  const state = ctx.region?.region_code?.toUpperCase() ?? '';
  if (!/^[A-Z]{2}$/.test(state)) return null;

  const streetLabel = suggestion.name?.trim() || suggestion.address?.trim() || '';
  if (!streetLabel) return null;

  const label =
    suggestion.full_address
      ?.replace(/, United States$/i, '')
      .replace(/, USA$/i, '')
      .trim() || streetLabel;

  let city = ctx.place?.name?.trim() ?? '';
  let zip = ctx.postcode?.name?.trim() ?? '';

  if (!city || !zip) {
    const tail = parseTailSegment(label.split(',').slice(1).join(', '));
    if (tail) {
      city = city || tail.city;
      zip = zip || tail.zip;
    }
  }

  const street =
    ctx.address?.name?.trim() ||
    (ctx.address?.address_number && ctx.address?.street_name
      ? `${ctx.address.address_number} ${ctx.address.street_name}`.trim()
      : '') ||
    suggestion.address?.trim() ||
    streetLabel;

  return {
    id: suggestion.mapbox_id,
    street,
    city,
    state,
    zip,
    label,
    streetLabel,
  };
}

export async function fetchMapboxAddressSuggestions(
  query: string,
  limit = 8,
): Promise<AddressSuggestion[]> {
  const token = getMapboxToken();
  const trimmed = query.trim();
  if (!token || trimmed.length < 2) return [];

  const params = new URLSearchParams({
    access_token: token,
    session_token: crypto.randomUUID(),
    country: 'US',
    limit: String(limit),
    language: 'en',
    q: trimmed,
  });

  const url = `https://api.mapbox.com/search/searchbox/v1/suggest?${params}`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) return [];

  const data = (await res.json()) as { suggestions?: SearchBoxSuggestion[] };
  const suggestions: AddressSuggestion[] = [];
  const seen = new Set<string>();

  for (const item of data.suggestions ?? []) {
    const parsed = parseSearchBoxSuggestion(item);
    if (!parsed) continue;
    const key = parsed.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    suggestions.push(parsed);
  }

  return suggestions;
}

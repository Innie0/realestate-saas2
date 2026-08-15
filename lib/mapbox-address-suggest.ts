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
  poi_category?: string[];
  context?: {
    place?: SearchBoxContextEntry;
    region?: SearchBoxContextEntry;
    postcode?: SearchBoxContextEntry;
    address?: SearchBoxContextEntry;
  };
}

interface GeocodingContextEntry {
  id?: string;
  text?: string;
  short_code?: string;
}

interface GeocodingFeature {
  id: string;
  place_type?: string[];
  text: string;
  place_name: string;
  address?: string;
  context?: GeocodingContextEntry[];
}

const US_STATE_CODES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
]);

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

/** Bare house numbers (e.g. "212") — Mapbox suggest needs suffix fan-out. */
const NUMERIC_HOUSE_PREFIX = /^\d{3,6}$/;

/** Common US street suffixes — far more useful than fanning out a–z. */
const FANOUT_STREET_SUFFIXES = [
  'St',
  'Ave',
  'Dr',
  'Rd',
  'Ln',
  'Way',
  'Blvd',
  'Ct',
  'Pl',
  'Cir',
  'N',
  'S',
  'E',
  'W',
  'NE',
  'NW',
  'SE',
  'SW',
];

const FANOUT_PER_SUFFIX = 3;

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

function isUsStateCode(state: string): boolean {
  return US_STATE_CODES.has(state.toUpperCase());
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
    if (isUsStateCode(state)) {
      return {
        city: fullStateZip[1].replace(/,\s*$/, '').trim(),
        state,
        zip: fullStateZip[3],
      };
    }
  }

  return null;
}

function sanitizeUsLabel(label: string): string {
  return label
    .replace(/, United States(?: of America)?$/i, '')
    .replace(/, USA$/i, '')
    .trim();
}

function resolveUsState(ctx: SearchBoxSuggestion['context'], label: string): string {
  const fromContext = ctx?.region?.region_code?.toUpperCase() ?? '';
  if (isUsStateCode(fromContext)) return fromContext;

  const tail = parseTailSegment(label.split(',').slice(1).join(', '));
  if (tail && isUsStateCode(tail.state)) return tail.state;

  const parts = label.split(',').map((part) => part.trim());
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const stateZip = parts[i].match(/^([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
    if (stateZip && isUsStateCode(stateZip[1])) return stateZip[1];

    if (isUsStateCode(parts[i])) return parts[i].toUpperCase();
  }

  return '';
}

function houseNumberFromLabel(label: string): string | null {
  const match = label.trim().match(/^(\d+)/);
  return match?.[1] ?? null;
}

function queryHousePrefix(query: string): string | null {
  const match = query.trim().match(/^(\d+)/);
  return match?.[1] ?? null;
}

function isUsAddressSuggestion(suggestion: SearchBoxSuggestion): boolean {
  if (suggestion.feature_type === 'address' || suggestion.feature_type === 'street') return true;
  if (suggestion.feature_type !== 'poi') return false;

  const categories = suggestion.poi_category ?? [];
  if (categories.includes('home') || categories.includes('residential')) return true;

  const street = suggestion.name?.trim() || suggestion.address?.trim() || '';
  return /^\d+\s/.test(street);
}

function parseSearchBoxSuggestion(
  suggestion: SearchBoxSuggestion,
  query: string,
): AddressSuggestion | null {
  if (!isUsAddressSuggestion(suggestion)) return null;

  const streetLabel = suggestion.name?.trim() || suggestion.address?.trim() || '';
  if (!streetLabel) return null;

  const label = sanitizeUsLabel(suggestion.full_address?.trim() || streetLabel);
  const state = resolveUsState(suggestion.context, label);
  if (!isUsStateCode(state)) return null;

  const ctx = suggestion.context ?? {};
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

  const houseNumber = houseNumberFromLabel(streetLabel);
  const queryPrefix = queryHousePrefix(query);
  if (queryPrefix && houseNumber && !houseNumber.startsWith(queryPrefix)) {
    return null;
  }

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

function parseGeocodingFeature(feature: GeocodingFeature, query: string): AddressSuggestion | null {
  const placeTypes = feature.place_type ?? [];
  if (!placeTypes.includes('address')) return null;

  const label = sanitizeUsLabel(feature.place_name);
  const stateEntry = feature.context?.find((entry) => entry.id?.startsWith('region'));
  let state = '';
  if (stateEntry?.short_code?.startsWith('US-')) {
    state = stateEntry.short_code.slice(3).toUpperCase();
  }
  if (!isUsStateCode(state)) {
    const tail = parseTailSegment(label.split(',').slice(1).join(', '));
    state = tail?.state ?? '';
  }
  if (!isUsStateCode(state)) return null;

  const city =
    feature.context?.find((entry) => entry.id?.startsWith('place.'))?.text?.trim() ?? '';
  const zip =
    feature.context?.find((entry) => entry.id?.startsWith('postcode.'))?.text?.trim() ?? '';

  const streetNumber = feature.address?.trim() ?? '';
  const streetName = feature.text?.trim() ?? '';
  const street = streetNumber && streetName ? `${streetNumber} ${streetName}`.trim() : streetName || label.split(',')[0]?.trim() || '';
  const streetLabel = street;

  const houseNumber = houseNumberFromLabel(streetLabel);
  const queryPrefix = queryHousePrefix(query);
  if (queryPrefix && houseNumber && !houseNumber.startsWith(queryPrefix)) {
    return null;
  }

  return {
    id: feature.id,
    street,
    city,
    state,
    zip,
    label,
    streetLabel,
  };
}

function rankSuggestion(suggestion: AddressSuggestion, query: string): number {
  const queryPrefix = queryHousePrefix(query) ?? query.trim();
  const houseNumber = houseNumberFromLabel(suggestion.streetLabel) ?? '';

  if (houseNumber === queryPrefix) return 0;
  if (houseNumber.startsWith(queryPrefix)) return 1;
  if (suggestion.streetLabel.toLowerCase().startsWith(query.trim().toLowerCase())) return 2;
  return 3;
}

async function fetchSearchBoxSuggestions(
  token: string,
  query: string,
  sessionToken: string,
  options: { limit?: number; types?: string } = {},
): Promise<SearchBoxSuggestion[]> {
  const params = new URLSearchParams({
    access_token: token,
    session_token: sessionToken,
    country: 'US',
    limit: String(options.limit ?? 10),
    language: 'en',
    q: query,
  });

  if (options.types) params.set('types', options.types);
  params.set('proximity', 'ip');

  const url = `https://api.mapbox.com/search/searchbox/v1/suggest?${params}`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) return [];

  const data = (await res.json()) as { suggestions?: SearchBoxSuggestion[] };
  return data.suggestions ?? [];
}

async function fetchGeocodingAddressFallback(
  token: string,
  query: string,
  limit: number,
): Promise<AddressSuggestion[]> {
  const params = new URLSearchParams({
    access_token: token,
    country: 'US',
    types: 'address',
    limit: String(limit),
    language: 'en',
    autocomplete: 'true',
  });

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) return [];

  const data = (await res.json()) as { features?: GeocodingFeature[] };
  return (data.features ?? [])
    .map((feature) => parseGeocodingFeature(feature, query))
    .filter((item): item is AddressSuggestion => Boolean(item));
}

function mergeParsedBatches(
  parsedBatches: AddressSuggestion[][],
  limit: number,
  interleaveFanout: boolean,
): AddressSuggestion[] {
  if (!interleaveFanout || parsedBatches.length <= 1) {
    return parsedBatches.flat().slice(0, limit);
  }

  const primary = parsedBatches[0] ?? [];
  const fanoutBuckets = parsedBatches.slice(1);
  const merged: AddressSuggestion[] = [...primary];
  const mergedKeys = new Set(merged.map((item) => item.label.toLowerCase()));

  let added = true;
  while (merged.length < limit && added) {
    added = false;
    for (const bucket of fanoutBuckets) {
      const next = bucket.find((item) => !mergedKeys.has(item.label.toLowerCase()));
      if (!next) continue;
      mergedKeys.add(next.label.toLowerCase());
      merged.push(next);
      added = true;
      if (merged.length >= limit) break;
    }
  }

  return merged;
}

function dedupeSuggestions(items: AddressSuggestion[]): AddressSuggestion[] {
  const seen = new Set<string>();
  const out: AddressSuggestion[] = [];
  for (const item of items) {
    const key = item.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export async function fetchMapboxAddressSuggestions(
  query: string,
  limit = 15,
  sessionToken?: string,
): Promise<AddressSuggestion[]> {
  const token = getMapboxToken();
  const trimmed = query.trim();
  if (!token || trimmed.length < 2) return [];

  const session = sessionToken?.trim() || crypto.randomUUID();
  const isNumericPrefix = NUMERIC_HOUSE_PREFIX.test(trimmed);

  const requests: Promise<SearchBoxSuggestion[]>[] = [
    fetchSearchBoxSuggestions(token, trimmed, session, {
      limit: 10,
      types: isNumericPrefix ? 'address' : undefined,
    }),
  ];

  if (isNumericPrefix) {
    for (const suffix of FANOUT_STREET_SUFFIXES) {
      requests.push(
        fetchSearchBoxSuggestions(token, `${trimmed} ${suffix}`, session, {
          limit: FANOUT_PER_SUFFIX,
          types: 'address',
        }),
      );
    }
  }

  const batches = await Promise.all(requests);
  const seen = new Set<string>();

  const parsedBatches = batches.map((batch) =>
    batch
      .map((item) => parseSearchBoxSuggestion(item, trimmed))
      .filter((item): item is AddressSuggestion => Boolean(item))
      .filter((item) => {
        const key = item.label.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
  );

  let suggestions = mergeParsedBatches(parsedBatches, limit, isNumericPrefix);

  if (suggestions.length === 0 && isNumericPrefix) {
    suggestions = await fetchGeocodingAddressFallback(token, trimmed, limit);
  }

  suggestions.sort((a, b) => {
    const rankDiff = rankSuggestion(a, trimmed) - rankSuggestion(b, trimmed);
    if (rankDiff !== 0) return rankDiff;
    return a.label.localeCompare(b.label);
  });

  return dedupeSuggestions(suggestions).slice(0, limit);
}

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

/** Mapbox returns almost no street addresses for bare house numbers (e.g. "5721"). */
const NUMERIC_HOUSE_PREFIX = /^\d{2,6}$/;

const FANOUT_LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const FANOUT_DIRECTIONALS = ['w', 'e', 'n', 's'];
const FANOUT_PER_LETTER = 2;
const FANOUT_PER_DIRECTIONAL = 3;

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

function houseNumberFromLabel(label: string): string | null {
  const match = label.trim().match(/^(\d+)/);
  return match?.[1] ?? null;
}

function queryHousePrefix(query: string): string | null {
  const match = query.trim().match(/^(\d+)/);
  return match?.[1] ?? null;
}

function isResidentialSuggestion(suggestion: SearchBoxSuggestion): boolean {
  if (suggestion.feature_type === 'address') return true;
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
  if (!isResidentialSuggestion(suggestion)) return null;

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

export async function fetchMapboxAddressSuggestions(
  query: string,
  limit = 15,
): Promise<AddressSuggestion[]> {
  const token = getMapboxToken();
  const trimmed = query.trim();
  if (!token || trimmed.length < 2) return [];

  const sessionToken = crypto.randomUUID();
  const requests: Promise<SearchBoxSuggestion[]>[] = [
    fetchSearchBoxSuggestions(token, trimmed, sessionToken, { limit: 10 }),
  ];

  if (NUMERIC_HOUSE_PREFIX.test(trimmed)) {
    for (const letter of FANOUT_LETTERS) {
      requests.push(
        fetchSearchBoxSuggestions(token, `${trimmed} ${letter}`, sessionToken, {
          limit: FANOUT_PER_LETTER,
          types: 'address',
        }),
      );
    }
    for (const dir of FANOUT_DIRECTIONALS) {
      requests.push(
        fetchSearchBoxSuggestions(token, `${trimmed} ${dir}`, sessionToken, {
          limit: FANOUT_PER_DIRECTIONAL,
          types: 'address',
        }),
      );
    }
  }

  const batches = await Promise.all(requests);
  const suggestions: AddressSuggestion[] = [];
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

  if (NUMERIC_HOUSE_PREFIX.test(trimmed) && parsedBatches.length > 1) {
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

    suggestions.push(...merged);
  } else {
    for (const batch of parsedBatches) {
      for (const parsed of batch) {
        suggestions.push(parsed);
      }
    }
  }

  suggestions.sort((a, b) => {
    const rankDiff = rankSuggestion(a, trimmed) - rankSuggestion(b, trimmed);
    if (rankDiff !== 0) return rankDiff;
    return a.label.localeCompare(b.label);
  });

  return suggestions.slice(0, limit);
}

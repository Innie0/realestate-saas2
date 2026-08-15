import type { ParsedAddress } from '@/lib/search/parse-address';

export interface AddressSuggestion extends ParsedAddress {
  id: string;
}

interface MapboxContext {
  id: string;
  text: string;
  short_code?: string;
}

interface MapboxFeature {
  id: string;
  text: string;
  place_name: string;
  address?: string;
  context?: MapboxContext[];
}

export function getMapboxToken(): string | null {
  return (
    process.env.MAPBOX_ACCESS_TOKEN ||
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    null
  );
}

export function parseMapboxFeature(feature: MapboxFeature): AddressSuggestion | null {
  const streetLine = feature.address
    ? `${feature.address} ${feature.text}`.trim()
    : feature.text?.trim();

  if (!streetLine) return null;

  let city = '';
  let state = '';
  let zip = '';

  for (const ctx of feature.context ?? []) {
    if (ctx.id.startsWith('place.')) city = ctx.text;
    if (ctx.id.startsWith('locality.')) city = city || ctx.text;
    if (ctx.id.startsWith('region.')) {
      state = ctx.short_code?.replace(/^US-/i, '').toUpperCase() ?? ctx.text;
    }
    if (ctx.id.startsWith('postcode.')) zip = ctx.text;
  }

  const label = feature.place_name
    .replace(/, United States$/i, '')
    .replace(/, USA$/i, '')
    .trim();

  if (!state) {
    const parsed = label.match(/,\s*([A-Za-z .]+),?\s*([A-Z]{2})(?:\s+(\d{5}))?$/);
    if (parsed) {
      city = city || parsed[1].trim();
      state = parsed[2].toUpperCase();
      zip = zip || parsed[3] || '';
    }
  }

  return {
    id: feature.id,
    street: streetLine,
    city,
    state,
    zip,
    label: label || streetLine,
  };
}

export async function fetchMapboxAddressSuggestions(
  query: string,
  limit = 6,
): Promise<AddressSuggestion[]> {
  const token = getMapboxToken();
  const trimmed = query.trim();
  if (!token || trimmed.length < 3) return [];

  const params = new URLSearchParams({
    access_token: token,
    autocomplete: 'true',
    country: 'us',
    types: 'address',
    limit: String(limit),
    language: 'en',
  });

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json?${params}`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!res.ok) return [];

  const data = (await res.json()) as { features?: MapboxFeature[] };
  const suggestions: AddressSuggestion[] = [];

  for (const feature of data.features ?? []) {
    const parsed = parseMapboxFeature(feature);
    if (parsed?.state) suggestions.push(parsed);
  }

  return suggestions;
}

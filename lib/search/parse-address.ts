export interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  label: string;
}

const STATE_ABBRS = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT',
  'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
]);

const STREET_HINT =
  /\b(st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|way|ct|court|pl|place|cir|circle|pkwy|parkway|hwy|highway)\b/i;

/** Heuristic: does this query look like a property address? */
export function looksLikeAddress(query: string): boolean {
  const trimmed = query.trim();
  if (trimmed.length < 6 || !/\d/.test(trimmed)) return false;
  if (trimmed.includes(',')) return true;
  return STREET_HINT.test(trimmed);
}

/** Best-effort parse of a free-form address string for property research deep links. */
export function parseAddressQuery(query: string): ParsedAddress | null {
  const trimmed = query.trim();
  if (!looksLikeAddress(trimmed)) return null;

  const parts = trimmed.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  if (parts.length === 1) {
    const stateMatch = trimmed.match(/\b([A-Z]{2})\b(?:\s+(\d{5}(?:-\d{4})?))?\s*$/i);
    if (stateMatch) {
      const state = stateMatch[1].toUpperCase();
      const zip = stateMatch[2] ?? '';
      const street = trimmed.slice(0, stateMatch.index).trim().replace(/,\s*$/, '');
      if (street && STATE_ABBRS.has(state)) {
        return { street, city: '', state, zip, label: trimmed };
      }
    }
    return { street: trimmed, city: '', state: '', zip: '', label: trimmed };
  }

  const street = parts[0];
  const tail = parts[parts.length - 1];
  const stateZip = tail.match(/^([A-Za-z]{2})\s*(\d{5}(?:-\d{4})?)?$/);
  if (stateZip) {
    const state = stateZip[1].toUpperCase();
    const zip = stateZip[2] ?? '';
    const city = parts.length > 2 ? parts.slice(1, -1).join(', ') : parts[1] ?? '';
    if (STATE_ABBRS.has(state)) {
      return { street, city, state, zip, label: trimmed };
    }
  }

  if (parts.length >= 3) {
    const maybeState = parts[parts.length - 1].slice(0, 2).toUpperCase();
    if (STATE_ABBRS.has(maybeState)) {
      const zipMatch = parts[parts.length - 1].match(/\d{5}(?:-\d{4})?/);
      return {
        street,
        city: parts.slice(1, -1).join(', '),
        state: maybeState,
        zip: zipMatch?.[0] ?? '',
        label: trimmed,
      };
    }
  }

  return { street, city: parts.slice(1).join(', '), state: '', zip: '', label: trimmed };
}

export function propertyResearchHref(query: string): string {
  const parsed = parseAddressQuery(query);
  const params = new URLSearchParams();
  if (parsed) {
    params.set('street', parsed.street);
    if (parsed.city) params.set('city', parsed.city);
    if (parsed.state) params.set('state', parsed.state);
    if (parsed.zip) params.set('zip', parsed.zip);
    if (parsed.state) params.set('auto', '1');
  } else {
    params.set('q', query.trim());
  }
  return `/dashboard/property-research?${params.toString()}`;
}

import { parseAddressQuery } from '@/lib/search/parse-address';

export interface PropertyAddressFields {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export function formatAddressLabel(fields: PropertyAddressFields): string {
  return [fields.street, fields.city, fields.state, fields.zip].filter(Boolean).join(', ');
}

export function buildPropertyResearchSearchParams(
  fields: PropertyAddressFields,
  extra?: Record<string, string>,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set('street', fields.street.trim());
  if (fields.city.trim()) params.set('city', fields.city.trim());
  params.set('state', fields.state.trim());
  if (fields.zip.trim()) params.set('zip', fields.zip.trim());
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      params.set(key, value);
    }
  }
  return params;
}

export function propertyResearchLandingHref(): string {
  return '/dashboard/property-research';
}

export function subjectPropertyHref(
  fields: PropertyAddressFields,
  options?: { auto?: boolean },
): string {
  const params = buildPropertyResearchSearchParams(
    fields,
    options?.auto ? { auto: '1' } : undefined,
  );
  return `/dashboard/property-research/subject?${params.toString()}`;
}

export function cmaPropertyHref(
  fields: PropertyAddressFields,
  options?: { auto?: boolean },
): string {
  const params = buildPropertyResearchSearchParams(
    fields,
    options?.auto ? { auto: '1' } : undefined,
  );
  return `/dashboard/property-research/cma?${params.toString()}`;
}

export function parsePropertyAddressFromSearchParams(
  searchParams: URLSearchParams,
): PropertyAddressFields | null {
  let street = searchParams.get('street')?.trim() ?? '';
  let city = searchParams.get('city')?.trim() ?? '';
  let state = searchParams.get('state')?.trim() ?? '';
  let zip = searchParams.get('zip')?.trim() ?? '';

  if (!street) {
    const q = searchParams.get('q')?.trim();
    if (q) {
      const parsed = parseAddressQuery(q);
      if (parsed) {
        street = parsed.street;
        city = parsed.city;
        state = parsed.state;
        zip = parsed.zip;
      } else {
        street = q;
      }
    }
  }

  if (!street.trim() || !state.trim()) return null;

  return { street, city, state, zip };
}

import { defaultSubject, type SubjectProperty } from '@/lib/cma';
import type { MapCoordinate } from '@/lib/cma-map-utils';

type LookupPerson = {
  propertyAddress?: {
    latitude?: number | null;
    longitude?: number | null;
  } | null;
  propertyDetails?: {
    bedrooms?: string | number | null;
    bathrooms?: string | number | null;
    squareFootage?: string | number | null;
    lotSize?: string | number | null;
    yearBuilt?: string | number | null;
    propertyType?: string | null;
  } | null;
};

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Build CMA subject defaults from an owner lookup result (no extra API call). */
export function subjectFromLookupPerson(person: LookupPerson | null | undefined): {
  subject: SubjectProperty;
  propertyType: string | null;
  subjectLocation: MapCoordinate | null;
} {
  if (!person) {
    return { subject: defaultSubject(), propertyType: null, subjectLocation: null };
  }

  const details = person.propertyDetails;
  const subject: SubjectProperty = {
    ...defaultSubject(),
    bedrooms: toNumber(details?.bedrooms),
    bathrooms: toNumber(details?.bathrooms),
    squareFootage: toNumber(details?.squareFootage),
    lotSize: toNumber(details?.lotSize),
    yearBuilt: toNumber(details?.yearBuilt),
  };

  const lat = person.propertyAddress?.latitude;
  const lng = person.propertyAddress?.longitude;
  const subjectLocation =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
      ? { latitude: lat, longitude: lng }
      : null;

  return {
    subject,
    propertyType: details?.propertyType ?? null,
    subjectLocation,
  };
}

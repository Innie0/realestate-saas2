/**
 * Subject property profile for CMA dashboard (county + listing context).
 */

import { propertyStaticImageUrl } from '@/lib/property-static-image';

export interface CmaSubjectProfile {
  imageUrl: string | null;
  propertyType: string | null;
  lotSize: number | null;
  yearBuilt: number | null;
  county: string | null;
  subdivision: string | null;
  zoning: string | null;
  assessedValue: number | null;
  lastSalePrice: number | null;
  lastSaleDate: string | null;
  ownerName: string | null;
  ownerOccupied: boolean | null;
  hoaFee: number | null;
}

export function buildSubjectProfile(
  rentcastProperty: Record<string, unknown> | null,
  subjectLocation: { latitude: number; longitude: number } | null,
): CmaSubjectProfile | null {
  if (!rentcastProperty) return null;

  const taxYears = rentcastProperty.taxAssessments
    ? Object.keys(rentcastProperty.taxAssessments as Record<string, unknown>).sort()
    : [];
  const latestYear = taxYears[taxYears.length - 1];
  const latestAssessment =
    latestYear && rentcastProperty.taxAssessments
      ? (rentcastProperty.taxAssessments as Record<string, { value?: number }>)[latestYear]
      : null;

  const lat =
    subjectLocation?.latitude ??
    (typeof rentcastProperty.latitude === 'number' ? rentcastProperty.latitude : null);
  const lng =
    subjectLocation?.longitude ??
    (typeof rentcastProperty.longitude === 'number' ? rentcastProperty.longitude : null);

  const owner = rentcastProperty.owner as { names?: string[]; type?: string } | undefined;
  const hoa = rentcastProperty.hoa as { fee?: number } | undefined;

  return {
    imageUrl: propertyStaticImageUrl(lat, lng, { width: 400, height: 260, zoom: 17 }),
    propertyType: (rentcastProperty.propertyType as string) ?? null,
    lotSize: (rentcastProperty.lotSize as number) ?? null,
    yearBuilt: (rentcastProperty.yearBuilt as number) ?? null,
    county: (rentcastProperty.county as string) ?? null,
    subdivision: (rentcastProperty.subdivision as string) ?? null,
    zoning: (rentcastProperty.zoning as string) ?? null,
    assessedValue: latestAssessment?.value ?? null,
    lastSalePrice: (rentcastProperty.lastSalePrice as number) ?? null,
    lastSaleDate: rentcastProperty.lastSaleDate
      ? new Date(rentcastProperty.lastSaleDate as string).toISOString()
      : null,
    ownerName: owner?.names?.[0] ?? null,
    ownerOccupied:
      typeof rentcastProperty.ownerOccupied === 'boolean'
        ? rentcastProperty.ownerOccupied
        : null,
    hoaFee: hoa?.fee ?? null,
  };
}

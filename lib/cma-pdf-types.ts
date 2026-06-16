import type { ConditionLevel, ScoredComp, SubjectProperty } from '@/lib/cma';

export interface CmaPdfComp {
  address: string;
  price: number | null;
  adjustedPrice: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFootage: number | null;
  soldDate: string | null;
  distance: number | null;
}

export interface CmaPdfPayload {
  address: string;
  propertyType: string | null;
  radius: number;
  yearsBack: number;
  subject: SubjectProperty;
  valuation: {
    suggestedPrice: number | null;
    priceLow: number | null;
    priceHigh: number | null;
    compCount: number;
    medianPricePerSqft: number | null;
  };
  avm: {
    estimatedValue: number | null;
    valueLow: number | null;
    valueHigh: number | null;
  } | null;
  rentEstimate: {
    monthlyRent: number | null;
  } | null;
  comps: CmaPdfComp[];
  summary: string | null;
  generatedAt: string;
}

export interface CmaPdfBranding {
  agentName: string;
  agentEmail: string;
  agentPhone: string | null;
  agentHeadline: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

export function conditionLabel(condition: ConditionLevel): string {
  const labels: Record<ConditionLevel, string> = {
    below_average: 'Below average',
    average: 'Average',
    updated: 'Updated',
    renovated: 'Renovated',
    luxury: 'Luxury / high-end',
  };
  return labels[condition] ?? condition;
}

export function formatPdfMoney(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `$${n.toLocaleString('en-US')}`;
}

export function formatPdfDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function compsFromScored(
  comps: ScoredComp[],
  conditionFactor: number
): CmaPdfComp[] {
  return comps.map((comp) => ({
    address: comp.address,
    price: comp.price,
    adjustedPrice: comp.adjustedPrice
      ? Math.round(comp.adjustedPrice * conditionFactor)
      : null,
    bedrooms: comp.bedrooms,
    bathrooms: comp.bathrooms,
    squareFootage: comp.squareFootage,
    soldDate: comp.soldDate,
    distance: comp.distance,
  }));
}

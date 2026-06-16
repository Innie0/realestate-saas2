import type { ScoredComp, SubjectProperty } from '@/lib/cma';

export interface CmaReportForPdf {
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
    conditionFactor: number;
  };
  avm: {
    estimatedValue: number | null;
    valueLow: number | null;
    valueHigh: number | null;
  } | null;
  rentEstimate: {
    monthlyRent: number | null;
  } | null;
  comps: ScoredComp[];
  summary: string | null;
}

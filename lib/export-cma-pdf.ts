import type { ScoredComp, SubjectProperty } from '@/lib/cma';
import {
  compsFromScored,
  type CmaPdfPayload,
} from '@/lib/cma-pdf-types';

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

export function buildCmaPdfPayload(
  result: CmaReportForPdf,
  options: {
    subject?: SubjectProperty;
    comps?: ScoredComp[];
    valuation?: CmaReportForPdf['valuation'];
  } = {}
): CmaPdfPayload {
  const subject = options.subject ?? result.subject;
  const valuation = options.valuation ?? result.valuation;
  const comps = options.comps ?? result.comps;

  return {
    address: result.address,
    propertyType: result.propertyType,
    radius: result.radius,
    yearsBack: result.yearsBack,
    subject,
    valuation: {
      suggestedPrice: valuation.suggestedPrice,
      priceLow: valuation.priceLow,
      priceHigh: valuation.priceHigh,
      compCount: valuation.compCount,
      medianPricePerSqft: valuation.medianPricePerSqft,
    },
    avm: result.avm
      ? {
          estimatedValue: result.avm.estimatedValue,
          valueLow: result.avm.valueLow,
          valueHigh: result.avm.valueHigh,
        }
      : null,
    rentEstimate: result.rentEstimate?.monthlyRent
      ? { monthlyRent: result.rentEstimate.monthlyRent }
      : null,
    comps: compsFromScored(comps, valuation.conditionFactor),
    summary: result.summary,
    generatedAt: new Date().toISOString(),
  };
}

export async function downloadCmaPdf(payload: CmaPdfPayload): Promise<void> {
  const res = await fetch('/api/market-analysis/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      typeof errData.error === 'string' ? errData.error : 'Failed to generate PDF.'
    );
  }

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? 'CMA-report.pdf';
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

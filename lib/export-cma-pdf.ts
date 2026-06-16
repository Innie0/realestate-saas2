'use client';

import type { CmaPdfPayload } from '@/lib/cma-pdf-types';
import type { CmaReportForPdf } from '@/lib/cma-report-types';
import { compsFromScored } from '@/lib/cma-pdf-types';
import type { ScoredComp, SubjectProperty } from '@/lib/cma';

export type { CmaReportForPdf };

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

function sanitizeFilename(address: string): string {
  const base = address
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return `CMA-${base || 'report'}.pdf`;
}

export async function downloadCmaPdf(payload: CmaPdfPayload): Promise<void> {
  const res = await fetch('/api/market-analysis/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const contentType = res.headers.get('Content-Type') ?? '';

  if (!res.ok) {
    if (contentType.includes('application/json')) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(
        typeof errData.error === 'string' ? errData.error : 'Failed to generate PDF.'
      );
    }
    throw new Error(`Failed to generate PDF (HTTP ${res.status}).`);
  }

  if (!contentType.includes('application/pdf')) {
    throw new Error('Unexpected response from PDF server.');
  }

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? sanitizeFilename(payload.address);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

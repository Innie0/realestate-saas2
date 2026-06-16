'use client';

import React from 'react';
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
  const brandingRes = await fetch('/api/market-analysis/pdf/branding');
  const brandingJson = await brandingRes.json().catch(() => ({}));

  if (!brandingRes.ok || !brandingJson.success) {
    throw new Error(
      typeof brandingJson.error === 'string'
        ? brandingJson.error
        : 'Could not load agent branding for PDF.'
    );
  }

  const [{ pdf }, { CmaPdfDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/lib/cma-pdf-document'),
  ]);

  let blob: Blob;
  try {
    blob = await pdf(
      React.createElement(CmaPdfDocument, {
        report: payload,
        branding: brandingJson.data,
      }) as React.ReactElement
    ).toBlob();
  } catch (err) {
    console.error('Client PDF render error:', err);
    throw new Error('Could not build PDF. Try again or contact support.');
  }

  const filename = sanitizeFilename(payload.address);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

'use client';

import type { CmaPdfPayload } from '@/lib/cma-pdf-types';
import type { CmaReportForPdf } from '@/lib/cma-report-types';
import { compsFromScored } from '@/lib/cma-pdf-types';
import type { ScoredComp, SubjectProperty } from '@/lib/cma';
import { createCmaReportElement } from '@/lib/cma-pdf-html';

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

async function fetchBranding() {
  const brandingRes = await fetch('/api/market-analysis/pdf/branding');
  const brandingJson = await brandingRes.json().catch(() => ({}));

  if (!brandingRes.ok || !brandingJson.success) {
    throw new Error(
      typeof brandingJson.error === 'string'
        ? brandingJson.error
        : 'Could not load agent branding for PDF.'
    );
  }

  return brandingJson.data;
}

export async function downloadCmaPdf(payload: CmaPdfPayload): Promise<void> {
  const branding = await fetchBranding();
  const filename = sanitizeFilename(payload.address);
  const mount = createCmaReportElement(payload, branding);
  const root = mount.querySelector('#cma-report-root') as HTMLElement | null;

  if (!root) {
    mount.remove();
    throw new Error('Could not prepare PDF layout.');
  }

  try {
    const html2pdf = (await import('html2pdf.js')).default;
    await html2pdf()
      .set({
        margin: [0.4, 0.4, 0.4, 0.4],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
      })
      .from(root)
      .save();
  } catch (err) {
    console.error('html2pdf export error:', err);
    throw new Error('Could not generate PDF. Try again or use Print to PDF from your browser.');
  } finally {
    mount.remove();
  }
}

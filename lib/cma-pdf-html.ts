import type { CmaPdfBranding, CmaPdfPayload } from '@/lib/cma-pdf-types';
import { conditionLabel, formatPdfDate, formatPdfMoney } from '@/lib/cma-pdf-types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function subjectPills(report: CmaPdfPayload): string {
  const { subject } = report;
  const pills: string[] = [];
  if (subject.bedrooms !== null) pills.push(`${subject.bedrooms} beds`);
  if (subject.bathrooms !== null) pills.push(`${subject.bathrooms} baths`);
  if (subject.squareFootage !== null) {
    pills.push(`${subject.squareFootage.toLocaleString()} sq ft`);
  }
  if (subject.yearBuilt !== null) pills.push(`Built ${subject.yearBuilt}`);
  if (subject.lotSize !== null) pills.push(`Lot ${subject.lotSize.toLocaleString()} sq ft`);
  pills.push(`Condition: ${conditionLabel(subject.condition)}`);
  if (subject.hasPool) pills.push('Pool');
  if (subject.garageSpaces > 0) pills.push(`${subject.garageSpaces} garage spaces`);
  return pills
    .map(
      (p) =>
        `<span style="display:inline-block;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:4px 8px;margin:0 6px 6px 0;font-size:11px;color:#374151;">${escapeHtml(p)}</span>`
    )
    .join('');
}

function compRows(report: CmaPdfPayload): string {
  if (report.comps.length === 0) {
    return `<tr><td colspan="5" style="padding:12px;color:#6b7280;font-size:11px;">No comparable sales included.</td></tr>`;
  }
  return report.comps
    .map((comp) => {
      const details = [
        comp.bedrooms !== null ? `${comp.bedrooms} bd` : null,
        comp.bathrooms !== null ? `${comp.bathrooms} ba` : null,
        comp.squareFootage !== null ? `${comp.squareFootage.toLocaleString()} sf` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      return `<tr>
        <td style="padding:8px 6px;border-bottom:1px solid #f3f4f6;font-size:10px;color:#374151;vertical-align:top;">${escapeHtml(comp.address)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f3f4f6;font-size:10px;font-weight:700;color:${escapeHtml('#374151')};text-align:right;vertical-align:top;">${formatPdfMoney(comp.price)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f3f4f6;font-size:10px;color:#374151;text-align:right;vertical-align:top;">${formatPdfMoney(comp.adjustedPrice)}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f3f4f6;font-size:10px;color:#374151;vertical-align:top;">${escapeHtml(details || '—')}</td>
        <td style="padding:8px 6px;border-bottom:1px solid #f3f4f6;font-size:10px;color:#374151;text-align:right;vertical-align:top;">${formatPdfDate(comp.soldDate)}</td>
      </tr>`;
    })
    .join('');
}

export function buildCmaReportHtml(report: CmaPdfPayload, branding: CmaPdfBranding): string {
  const primary = branding.primaryColor || '#fc5c03';
  const secondary = branding.secondaryColor || '#0369a1';
  const { valuation } = report;
  const reportDate = formatPdfDate(report.generatedAt);
  const contact = [branding.agentPhone, branding.agentEmail].filter(Boolean).join(' · ');
  const logoBlock = branding.logoUrl
    ? `<img src="${escapeHtml(branding.logoUrl)}" alt="" style="max-width:88px;max-height:40px;object-fit:contain;" crossorigin="anonymous" />`
    : '';

  const priceBlock = valuation.suggestedPrice
    ? `<div style="font-size:32px;font-weight:700;color:${primary};margin:4px 0 8px;">${formatPdfMoney(valuation.suggestedPrice)}</div>
       <div style="font-size:12px;color:#4b5563;">Estimated range: ${formatPdfMoney(valuation.priceLow)} – ${formatPdfMoney(valuation.priceHigh)}</div>`
    : `<div style="font-size:12px;color:#4b5563;">Insufficient comparable sales for a price estimate. Widen search radius or history.</div>`;

  const avmBlock = report.avm?.estimatedValue
    ? `<div style="font-size:20px;font-weight:700;color:#374151;">${formatPdfMoney(report.avm.estimatedValue)}</div>
       <div style="font-size:10px;color:#9ca3af;margin-top:4px;">${formatPdfMoney(report.avm.valueLow)} – ${formatPdfMoney(report.avm.valueHigh)}</div>`
    : `<div style="font-size:20px;font-weight:700;color:#374151;">—</div>`;

  const rentBlock = report.rentEstimate?.monthlyRent
    ? `<div style="font-size:20px;font-weight:700;color:#374151;">${formatPdfMoney(report.rentEstimate.monthlyRent)}<span style="font-size:12px;font-weight:400;color:#6b7280;">/mo</span></div>`
    : `<div style="font-size:20px;font-weight:700;color:#374151;">—</div>`;

  const summaryBlock = report.summary
    ? `<div style="border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:16px;">
         <div style="font-size:11px;font-weight:700;color:${secondary};text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;">Market summary</div>
         <div style="font-size:11px;line-height:1.55;color:#4b5563;">${escapeHtml(report.summary)}</div>
       </div>`
    : '';

  return `<div id="cma-report-root" style="width:720px;padding:0;font-family:Helvetica,Arial,sans-serif;color:#1f2937;background:#fff;box-sizing:border-box;">
    <div style="background:${primary};color:#fff;padding:22px 28px;display:flex;justify-content:space-between;align-items:center;gap:16px;">
      <div>
        <div style="font-size:22px;font-weight:700;">Comparative Market Analysis</div>
        <div style="font-size:11px;margin-top:6px;opacity:0.95;">${escapeHtml(report.address)}${report.propertyType ? ` · ${escapeHtml(report.propertyType)}` : ''}</div>
      </div>
      ${logoBlock}
    </div>

    <div style="padding:24px 28px 28px;">
      <div style="font-size:10px;color:#9ca3af;margin-bottom:16px;">
        Prepared ${reportDate} · ${valuation.compCount} comparable sale${valuation.compCount !== 1 ? 's' : ''} within ${report.radius} mi · ${report.yearsBack} yr history
      </div>

      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:16px;">
        <div style="font-size:11px;font-weight:700;color:${secondary};text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;">Suggested list price</div>
        ${priceBlock}
      </div>

      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:16px;">
        <div style="font-size:11px;font-weight:700;color:${secondary};text-transform:uppercase;letter-spacing:0.04em;margin-bottom:10px;">Subject property</div>
        <div>${subjectPills(report)}</div>
      </div>

      <div style="display:flex;gap:12px;margin-bottom:16px;">
        <div style="flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">
          <div style="font-size:10px;color:#6b7280;margin-bottom:6px;">AVM reference (automated estimate)</div>
          ${avmBlock}
        </div>
        <div style="flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">
          <div style="font-size:10px;color:#6b7280;margin-bottom:6px;">Rent estimate</div>
          ${rentBlock}
        </div>
      </div>

      ${summaryBlock}

      <div style="margin-bottom:20px;">
        <div style="font-size:11px;font-weight:700;color:${secondary};text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;">Comparable sales</div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:8px 6px;text-align:left;font-size:9px;color:#6b7280;width:34%;">Address</th>
              <th style="padding:8px 6px;text-align:right;font-size:9px;color:#6b7280;width:14%;">Sold</th>
              <th style="padding:8px 6px;text-align:right;font-size:9px;color:#6b7280;width:14%;">Adjusted</th>
              <th style="padding:8px 6px;text-align:left;font-size:9px;color:#6b7280;width:22%;">Details</th>
              <th style="padding:8px 6px;text-align:right;font-size:9px;color:#6b7280;width:16%;">Date</th>
            </tr>
          </thead>
          <tbody>${compRows(report)}</tbody>
        </table>
      </div>

      <div style="border-top:1px solid #e5e7eb;padding-top:12px;">
        <div style="font-size:12px;font-weight:700;color:#111827;">${escapeHtml(branding.agentName)}${branding.agentHeadline ? ` · ${escapeHtml(branding.agentHeadline)}` : ''}</div>
        <div style="font-size:10px;color:#6b7280;margin-top:4px;">${escapeHtml(contact)}</div>
        <div style="font-size:8px;color:#9ca3af;margin-top:8px;line-height:1.45;">
          This Comparative Market Analysis is for informational purposes only and is not an appraisal. All data is deemed reliable but not guaranteed. Pricing recommendations should be verified by a licensed professional. Prepared via Realestic.
        </div>
      </div>
    </div>
  </div>`;
}

export function createCmaReportElement(
  report: CmaPdfPayload,
  branding: CmaPdfBranding
): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-10000px';
  wrapper.style.top = '0';
  wrapper.style.width = '720px';
  wrapper.style.background = '#ffffff';
  wrapper.innerHTML = buildCmaReportHtml(report, branding);
  document.body.appendChild(wrapper);
  return wrapper;
}

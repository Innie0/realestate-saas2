import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont, RGB } from 'pdf-lib';
import type { CmaPdfBranding, CmaPdfPayload } from '@/lib/cma-pdf-types';
import { conditionLabel, formatPdfDate, formatPdfMoney } from '@/lib/cma-pdf-types';

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 48;
const FOOTER_Y = 52;

function hexToRgb(hex: string): RGB {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return rgb(0.99, 0.36, 0.01);
  const n = parseInt(cleaned, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

class PdfWriter {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  font: PDFFont;
  fontBold: PDFFont;
  primary: RGB;
  secondary: RGB;
  branding: CmaPdfBranding;

  constructor(
    doc: PDFDocument,
    page: PDFPage,
    font: PDFFont,
    fontBold: PDFFont,
    branding: CmaPdfBranding
  ) {
    this.doc = doc;
    this.page = page;
    this.y = PAGE_H - MARGIN;
    this.font = font;
    this.fontBold = fontBold;
    this.primary = hexToRgb(branding.primaryColor);
    this.secondary = hexToRgb(branding.secondaryColor);
    this.branding = branding;
  }

  ensureSpace(needed: number) {
    if (this.y - needed >= FOOTER_Y + 20) return;
    this.drawFooter();
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
  }

  drawFooter() {
    const contact = [this.branding.agentPhone, this.branding.agentEmail]
      .filter(Boolean)
      .join(' · ');
    this.page.drawLine({
      start: { x: MARGIN, y: FOOTER_Y + 28 },
      end: { x: PAGE_W - MARGIN, y: FOOTER_Y + 28 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });
    this.page.drawText(this.branding.agentName, {
      x: MARGIN,
      y: FOOTER_Y + 14,
      size: 10,
      font: this.fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    if (contact) {
      this.page.drawText(contact, {
        x: MARGIN,
        y: FOOTER_Y,
        size: 8,
        font: this.font,
        color: rgb(0.45, 0.45, 0.45),
      });
    }
  }

  sectionTitle(title: string) {
    this.ensureSpace(24);
    this.page.drawText(title.toUpperCase(), {
      x: MARGIN,
      y: this.y,
      size: 9,
      font: this.fontBold,
      color: this.secondary,
    });
    this.y -= 16;
  }

  textLine(text: string, size = 10, bold = false, color = rgb(0.2, 0.2, 0.2)) {
    this.ensureSpace(size + 6);
    this.page.drawText(text, {
      x: MARGIN,
      y: this.y,
      size,
      font: bold ? this.fontBold : this.font,
      color,
    });
    this.y -= size + 6;
  }

  textBlock(text: string, size = 10) {
    for (const line of wrapText(text, 95)) {
      this.textLine(line, size);
    }
  }
}

export async function generateCmaPdfBuffer(
  report: CmaPdfPayload,
  branding: CmaPdfBranding
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`CMA — ${report.address}`);
  doc.setAuthor(branding.agentName);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const primary = hexToRgb(branding.primaryColor);
  const w = new PdfWriter(doc, page, font, fontBold, branding);

  // Header band
  page.drawRectangle({ x: 0, y: PAGE_H - 72, width: PAGE_W, height: 72, color: primary });
  page.drawText('Comparative Market Analysis', {
    x: MARGIN,
    y: PAGE_H - 38,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  const sub = `${report.address}${report.propertyType ? ` · ${report.propertyType}` : ''}`;
  for (const [i, line] of wrapText(sub, 70).slice(0, 2).entries()) {
    page.drawText(line, {
      x: MARGIN,
      y: PAGE_H - 56 - i * 12,
      size: 9,
      font,
      color: rgb(1, 1, 1),
    });
  }

  w.y = PAGE_H - 96;
  w.textLine(
    `Prepared ${formatPdfDate(report.generatedAt)} · ${report.valuation.compCount} comp(s) · ${report.radius} mi · ${report.yearsBack} yr`,
    8,
    false,
    rgb(0.55, 0.55, 0.55)
  );
  w.y -= 4;

  w.sectionTitle('Suggested list price');
  if (report.valuation.suggestedPrice) {
    w.textLine(formatPdfMoney(report.valuation.suggestedPrice), 24, true, primary);
    w.textLine(
      `Range: ${formatPdfMoney(report.valuation.priceLow)} – ${formatPdfMoney(report.valuation.priceHigh)}`,
      11
    );
  } else {
    w.textBlock('Insufficient comparable sales. Widen radius or history.');
  }

  w.sectionTitle('Subject property');
  const { subject } = report;
  const facts = [
    subject.bedrooms !== null ? `${subject.bedrooms} beds` : null,
    subject.bathrooms !== null ? `${subject.bathrooms} baths` : null,
    subject.squareFootage !== null ? `${subject.squareFootage.toLocaleString()} sq ft` : null,
    subject.yearBuilt !== null ? `Built ${subject.yearBuilt}` : null,
    subject.lotSize !== null ? `Lot ${subject.lotSize.toLocaleString()} sq ft` : null,
    `Condition: ${conditionLabel(subject.condition)}`,
    subject.hasPool ? 'Pool' : null,
    subject.garageSpaces > 0 ? `${subject.garageSpaces} garage spaces` : null,
  ]
    .filter(Boolean)
    .join('  ·  ');
  w.textBlock(facts, 10);

  w.sectionTitle('Reference estimates');
  w.textLine(
    `AVM: ${report.avm?.estimatedValue ? formatPdfMoney(report.avm.estimatedValue) : '—'}`,
    11
  );
  w.textLine(
    `Rent: ${report.rentEstimate?.monthlyRent ? `${formatPdfMoney(report.rentEstimate.monthlyRent)}/mo` : '—'}`,
    11
  );

  if (report.summary) {
    w.sectionTitle('Market summary');
    w.textBlock(report.summary, 10);
  }

  if (report.comps.length > 0) {
    w.sectionTitle('Comparable sales');
    w.textLine('Address · Sold · Adjusted · Details · Date', 8, true, rgb(0.45, 0.45, 0.45));
    for (const comp of report.comps) {
      const details = [
        comp.bedrooms !== null ? `${comp.bedrooms}bd` : null,
        comp.bathrooms !== null ? `${comp.bathrooms}ba` : null,
        comp.squareFootage !== null ? `${comp.squareFootage.toLocaleString()}sf` : null,
      ]
        .filter(Boolean)
        .join(' ');
      const line = `${comp.address} | ${formatPdfMoney(comp.price)} | ${formatPdfMoney(comp.adjustedPrice)} | ${details || '—'} | ${formatPdfDate(comp.soldDate)}`;
      for (const wrapped of wrapText(line, 100)) {
        w.textLine(wrapped, 8);
      }
      w.y -= 2;
    }
  }

  w.drawFooter();
  w.textLine(
    'This CMA is for informational purposes only and is not an appraisal. Data deemed reliable but not guaranteed.',
    7,
    false,
    rgb(0.6, 0.6, 0.6)
  );

  return doc.save();
}

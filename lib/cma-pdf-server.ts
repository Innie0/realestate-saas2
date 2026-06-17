import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFImage,
  type PDFPage,
  type PDFFont,
  RGB,
} from 'pdf-lib';
import type { CmaPdfBranding, CmaPdfPayload } from '@/lib/cma-pdf-types';
import { conditionLabel, formatPdfDate, formatPdfMoney } from '@/lib/cma-pdf-types';

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 44;
const FOOTER_H = 56;
const CONTENT_W = PAGE_W - MARGIN * 2;
const HEADER_H = 96;
const AGENT_CARD_W = 188;

const COLORS = {
  text: rgb(0.15, 0.15, 0.18),
  muted: rgb(0.45, 0.45, 0.5),
  light: rgb(0.96, 0.96, 0.97),
  border: rgb(0.88, 0.88, 0.9),
  white: rgb(1, 1, 1),
};

function hexToRgb(hex: string): RGB {
  const cleaned = hex.replace('#', '');
  if (cleaned.length !== 6) return rgb(0.99, 0.36, 0.01);
  const n = parseInt(cleaned, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

function tint(color: RGB, amount: number): RGB {
  return rgb(
    color.red + (1 - color.red) * amount,
    color.green + (1 - color.green) * amount,
    color.blue + (1 - color.blue) * amount
  );
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

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

async function embedImage(doc: PDFDocument, bytes: Uint8Array | null | undefined): Promise<PDFImage | null> {
  if (!bytes?.length) return null;
  try {
    return await doc.embedPng(bytes);
  } catch {
    try {
      return await doc.embedJpg(bytes);
    } catch {
      return null;
    }
  }
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
  pageNum = 1;

  constructor(
    doc: PDFDocument,
    page: PDFPage,
    font: PDFFont,
    fontBold: PDFFont,
    branding: CmaPdfBranding
  ) {
    this.doc = doc;
    this.page = page;
    this.y = PAGE_H - HEADER_H - 28;
    this.font = font;
    this.fontBold = fontBold;
    this.primary = hexToRgb(branding.primaryColor);
    this.secondary = hexToRgb(branding.secondaryColor);
    this.branding = branding;
  }

  minY() {
    return FOOTER_H + 12;
  }

  newPage() {
    this.drawFooter();
    this.pageNum += 1;
    this.page = this.doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
  }

  ensureSpace(needed: number) {
    if (this.y - needed >= this.minY()) return;
    this.newPage();
  }

  drawFooter() {
    const y = FOOTER_H - 8;
    this.page.drawLine({
      start: { x: MARGIN, y: y + 36 },
      end: { x: PAGE_W - MARGIN, y: y + 36 },
      thickness: 0.75,
      color: COLORS.border,
    });

    const contactParts = [
      this.branding.agentPhone,
      this.branding.agentEmail,
    ].filter(Boolean);

    this.page.drawText(this.branding.agentName, {
      x: MARGIN,
      y: y + 20,
      size: 9,
      font: this.fontBold,
      color: COLORS.text,
    });

    if (contactParts.length) {
      this.page.drawText(contactParts.join('  ·  '), {
        x: MARGIN,
        y: y + 8,
        size: 8,
        font: this.font,
        color: COLORS.muted,
      });
    }

    const disclaimer =
      'For informational purposes only — not an appraisal. Data deemed reliable but not guaranteed.';
    const discLines = wrapText(disclaimer, 72);
    for (const [i, line] of discLines.entries()) {
      this.page.drawText(line, {
        x: PAGE_W - MARGIN - 260,
        y: y + 20 - i * 10,
        size: 7,
        font: this.font,
        color: COLORS.muted,
        maxWidth: 260,
      });
    }

    this.page.drawText(`Page ${this.pageNum}`, {
      x: PAGE_W - MARGIN - 40,
      y: y + 8,
      size: 7,
      font: this.font,
      color: COLORS.muted,
    });
  }

  sectionTitle(title: string) {
    this.ensureSpace(28);
    this.y -= 6;
    this.page.drawText(title.toUpperCase(), {
      x: MARGIN,
      y: this.y,
      size: 8,
      font: this.fontBold,
      color: this.secondary,
    });
    this.y -= 4;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_W - MARGIN, y: this.y },
      thickness: 1,
      color: tint(this.secondary, 0.75),
    });
    this.y -= 14;
  }

  drawRoundedBox(x: number, topY: number, w: number, h: number, fill: RGB, border?: RGB) {
    this.page.drawRectangle({ x, y: topY - h, width: w, height: h, color: fill, borderColor: border, borderWidth: border ? 1 : 0 });
  }

  textAt(x: number, y: number, text: string, size: number, bold = false, color = COLORS.text) {
    this.page.drawText(text, { x, y, size, font: bold ? this.fontBold : this.font, color });
  }

  textBlock(x: number, maxW: number, text: string, size: number, color = COLORS.text): number {
    const chars = Math.max(20, Math.floor(maxW / (size * 0.52)));
    const lines = wrapText(text, chars);
    let cy = this.y;
    for (const line of lines) {
      this.ensureSpace(size + 4);
      this.textAt(x, cy, line, size, false, color);
      cy -= size + 4;
    }
    this.y = cy;
    return lines.length * (size + 4);
  }
}

function drawAgentContactCard(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  branding: CmaPdfBranding,
  photo: PDFImage | null,
  x: number,
  topY: number
) {
  const cardH = 72;
  const cardY = topY - cardH;

  page.drawRectangle({
    x,
    y: cardY,
    width: AGENT_CARD_W,
    height: cardH,
    color: COLORS.white,
    borderColor: rgb(1, 1, 1),
    borderWidth: 0,
  });

  let textX = x + 10;
  const photoSize = 44;
  if (photo) {
    page.drawImage(photo, {
      x: x + 10,
      y: cardY + 14,
      width: photoSize,
      height: photoSize,
    });
    textX = x + 10 + photoSize + 8;
  }

  page.drawText('Prepared by', {
    x: textX,
    y: cardY + cardH - 16,
    size: 7,
    font,
    color: COLORS.muted,
  });
  page.drawText(truncate(branding.agentName, 22), {
    x: textX,
    y: cardY + cardH - 28,
    size: 10,
    font: fontBold,
    color: COLORS.text,
  });

  let detailY = cardY + cardH - 40;
  if (branding.agentHeadline) {
    page.drawText(truncate(branding.agentHeadline, 28), {
      x: textX,
      y: detailY,
      size: 7,
      font,
      color: COLORS.muted,
    });
    detailY -= 11;
  }
  if (branding.agentPhone) {
    page.drawText(branding.agentPhone, {
      x: textX,
      y: detailY,
      size: 8,
      font,
      color: COLORS.text,
    });
    detailY -= 11;
  }
  if (branding.agentEmail) {
    page.drawText(truncate(branding.agentEmail, 30), {
      x: textX,
      y: detailY,
      size: 7,
      font,
      color: COLORS.muted,
    });
  }
}

function drawHeader(
  page: PDFPage,
  font: PDFFont,
  fontBold: PDFFont,
  report: CmaPdfPayload,
  branding: CmaPdfBranding,
  primary: RGB,
  logo: PDFImage | null,
  photo: PDFImage | null
) {
  page.drawRectangle({ x: 0, y: PAGE_H - HEADER_H, width: PAGE_W, height: HEADER_H, color: primary });

  let titleX = MARGIN;
  if (logo) {
    const logoH = 36;
    const scale = logoH / logo.height;
    const logoW = logo.width * scale;
    page.drawImage(logo, {
      x: MARGIN,
      y: PAGE_H - HEADER_H + (HEADER_H - logoH) / 2,
      width: logoW,
      height: logoH,
    });
    titleX = MARGIN + logoW + 14;
  }

  page.drawText('Comparative Market Analysis', {
    x: titleX,
    y: PAGE_H - 42,
    size: 17,
    font: fontBold,
    color: COLORS.white,
  });

  const sub = `${report.address}${report.propertyType ? `  ·  ${report.propertyType}` : ''}`;
  const maxTitleChars = logo ? 42 : 58;
  for (const [i, line] of wrapText(sub, maxTitleChars).slice(0, 2).entries()) {
    page.drawText(line, {
      x: titleX,
      y: PAGE_H - 58 - i * 12,
      size: 9,
      font,
      color: rgb(1, 1, 1),
    });
  }

  drawAgentContactCard(
    page,
    font,
    fontBold,
    branding,
    photo,
    PAGE_W - MARGIN - AGENT_CARD_W,
    PAGE_H - 12
  );
}

function drawPriceHero(w: PdfWriter, report: CmaPdfPayload) {
  const boxH = 88;
  w.ensureSpace(boxH + 16);
  const topY = w.y;
  w.drawRoundedBox(MARGIN, topY, CONTENT_W, boxH, tint(w.primary, 0.92), w.primary);

  const centerX = MARGIN + CONTENT_W / 2;
  w.textAt(centerX - 72, topY - 22, 'SUGGESTED LIST PRICE', 8, true, w.secondary);

  if (report.valuation.suggestedPrice) {
    const priceStr = formatPdfMoney(report.valuation.suggestedPrice);
    const priceW = priceStr.length * 14;
    w.textAt(centerX - priceW / 2 + 10, topY - 52, priceStr, 28, true, w.primary);
    const rangeStr = `Range: ${formatPdfMoney(report.valuation.priceLow)} – ${formatPdfMoney(report.valuation.priceHigh)}`;
    const rangeW = rangeStr.length * 3.2;
    w.textAt(centerX - rangeW / 2, topY - 72, rangeStr, 10, false, COLORS.muted);
  } else {
    w.textAt(MARGIN + 16, topY - 48, 'Insufficient comparable sales — widen radius or history.', 11, false, COLORS.muted);
  }

  w.y = topY - boxH - 16;
}

function drawTwoColumnFacts(w: PdfWriter, report: CmaPdfPayload) {
  w.sectionTitle('Property overview');

  const colW = (CONTENT_W - 16) / 2;
  const leftX = MARGIN;
  const rightX = MARGIN + colW + 16;
  const pad = 12;

  const { subject } = report;
  const subjectStr = [
    subject.bedrooms !== null ? `${subject.bedrooms} beds` : null,
    subject.bathrooms !== null ? `${subject.bathrooms} baths` : null,
    subject.squareFootage !== null ? `${subject.squareFootage.toLocaleString()} sq ft` : null,
    subject.yearBuilt !== null ? `Built ${subject.yearBuilt}` : null,
    subject.lotSize !== null ? `Lot ${subject.lotSize.toLocaleString()} sq ft` : null,
    `Condition: ${conditionLabel(subject.condition)}`,
    subject.hasPool ? 'Pool' : null,
    subject.garageSpaces > 0 ? `${subject.garageSpaces}-car garage` : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  const leftLines = wrapText(subjectStr, Math.max(24, Math.floor((colW - pad * 2) / 4.6)));
  const leftInnerH = 28 + leftLines.length * 13 + pad;
  const rightInnerH = 34 + 16 + 14 + 22 + 16 + 12 + pad;
  const boxH = Math.max(leftInnerH, rightInnerH, 102);

  w.ensureSpace(boxH + 8);
  const topY = w.y;

  w.drawRoundedBox(leftX, topY, colW, boxH, COLORS.light, COLORS.border);
  w.drawRoundedBox(rightX, topY, colW, boxH, COLORS.light, COLORS.border);

  w.textAt(leftX + pad, topY - 18, 'Subject property', 8, true, w.secondary);
  let ly = topY - 32;
  for (const line of leftLines) {
    w.textAt(leftX + pad, ly, line, 9);
    ly -= 13;
  }

  w.textAt(rightX + pad, topY - 18, 'Reference estimates', 8, true, w.secondary);
  let ry = topY - 34;
  w.textAt(rightX + pad, ry, 'Automated valuation (AVM)', 8, false, COLORS.muted);
  ry -= 16;
  w.textAt(
    rightX + pad,
    ry,
    report.avm?.estimatedValue ? formatPdfMoney(report.avm.estimatedValue) : '—',
    14,
    true,
    COLORS.text
  );
  ry -= 22;
  w.textAt(rightX + pad, ry, 'Estimated rent', 8, false, COLORS.muted);
  ry -= 16;
  w.textAt(
    rightX + pad,
    ry,
    report.rentEstimate?.monthlyRent ? `${formatPdfMoney(report.rentEstimate.monthlyRent)}/mo` : '—',
    12,
    true,
    COLORS.text
  );

  w.y = topY - boxH - 12;
}

function drawSummaryBox(w: PdfWriter, summary: string) {
  w.sectionTitle('Market summary');
  const lines = wrapText(summary, 88);
  const boxH = lines.length * 13 + 24;
  w.ensureSpace(boxH + 8);
  const topY = w.y;
  w.drawRoundedBox(MARGIN, topY, CONTENT_W, boxH, COLORS.light, COLORS.border);

  let cy = topY - 18;
  for (const line of lines) {
    w.textAt(MARGIN + 14, cy, line, 9.5, false, COLORS.text);
    cy -= 13;
  }
  w.y = topY - boxH - 12;
}

const COMP_COLS = {
  address: { x: MARGIN + 4, w: 168 },
  sold: { x: MARGIN + 176, w: 58 },
  adjusted: { x: MARGIN + 238, w: 58 },
  details: { x: MARGIN + 300, w: 72 },
  date: { x: MARGIN + 376, w: 72 },
};

function drawCompTableHeader(w: PdfWriter) {
  w.ensureSpace(22);
  const headerY = w.y;
  w.page.drawRectangle({
    x: MARGIN,
    y: headerY - 18,
    width: CONTENT_W,
    height: 18,
    color: tint(w.secondary, 0.85),
  });

  w.textAt(COMP_COLS.address.x, headerY - 13, 'Address', 7, true, COLORS.white);
  w.textAt(COMP_COLS.sold.x, headerY - 13, 'Sold', 7, true, COLORS.white);
  w.textAt(COMP_COLS.adjusted.x, headerY - 13, 'Adjusted', 7, true, COLORS.white);
  w.textAt(COMP_COLS.details.x, headerY - 13, 'Details', 7, true, COLORS.white);
  w.textAt(COMP_COLS.date.x, headerY - 13, 'Date', 7, true, COLORS.white);
  w.y = headerY - 22;
}

function drawCompRow(w: PdfWriter, comp: CmaPdfPayload['comps'][0], rowIndex: number) {
  const rowH = 28;
  w.ensureSpace(rowH + 4);

  const topY = w.y;
  if (rowIndex % 2 === 0) {
    w.page.drawRectangle({
      x: MARGIN,
      y: topY - rowH,
      width: CONTENT_W,
      height: rowH,
      color: COLORS.light,
    });
  }

  const details = [
    comp.bedrooms !== null ? `${comp.bedrooms}bd` : null,
    comp.bathrooms !== null ? `${comp.bathrooms}ba` : null,
    comp.squareFootage !== null ? `${comp.squareFootage.toLocaleString()} sf` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const addrLines = wrapText(comp.address, 32).slice(0, 2);
  w.textAt(COMP_COLS.address.x, topY - 12, addrLines[0] ?? '—', 7.5, false, COLORS.text);
  if (addrLines[1]) {
    w.textAt(COMP_COLS.address.x, topY - 22, addrLines[1], 7, false, COLORS.muted);
  }

  w.textAt(COMP_COLS.sold.x, topY - 16, formatPdfMoney(comp.price), 8, true, COLORS.text);
  w.textAt(COMP_COLS.adjusted.x, topY - 16, formatPdfMoney(comp.adjustedPrice), 8, false, w.primary);
  w.textAt(COMP_COLS.details.x, topY - 16, details || '—', 7.5, false, COLORS.muted);
  w.textAt(COMP_COLS.date.x, topY - 16, formatPdfDate(comp.soldDate), 7.5, false, COLORS.muted);

  w.y = topY - rowH - 2;
}

function drawAgentContactSection(w: PdfWriter) {
  w.sectionTitle('Your agent');
  const boxH = 64;
  w.ensureSpace(boxH + 8);
  const topY = w.y;
  w.drawRoundedBox(MARGIN, topY, CONTENT_W, boxH, tint(w.primary, 0.94), w.primary);

  w.textAt(MARGIN + 16, topY - 22, w.branding.agentName, 12, true, COLORS.text);
  let cy = topY - 38;
  if (w.branding.agentHeadline) {
    w.textAt(MARGIN + 16, cy, w.branding.agentHeadline, 9, false, COLORS.muted);
    cy -= 14;
  }

  const contactLine = [w.branding.agentPhone, w.branding.agentEmail].filter(Boolean).join('   ·   ');
  if (contactLine) {
    w.textAt(MARGIN + 16, cy, contactLine, 9, false, COLORS.text);
  }

  w.textAt(MARGIN + 16, topY - boxH + 12, 'Questions about this analysis? Reach out anytime.', 8, false, COLORS.muted);
  w.y = topY - boxH - 12;
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

  const [logo, photo] = await Promise.all([
    embedImage(doc, branding.logoBytes),
    embedImage(doc, branding.photoBytes),
  ]);

  drawHeader(page, font, fontBold, report, branding, primary, logo, photo);

  const w = new PdfWriter(doc, page, font, fontBold, branding);

  w.textAt(
    MARGIN,
    w.y,
    `Prepared ${formatPdfDate(report.generatedAt)}  ·  ${report.valuation.compCount} comparable sale${report.valuation.compCount === 1 ? '' : 's'}  ·  ${report.radius} mi radius  ·  ${report.yearsBack} yr lookback`,
    8,
    false,
    COLORS.muted
  );
  w.y -= 18;

  drawPriceHero(w, report);
  drawTwoColumnFacts(w, report);

  if (report.summary) {
    drawSummaryBox(w, report.summary);
  }

  if (report.comps.length > 0) {
    w.sectionTitle(`Comparable sales (${report.comps.length})`);
    drawCompTableHeader(w);
    for (const [i, comp] of report.comps.entries()) {
      drawCompRow(w, comp, i);
    }
  }

  drawAgentContactSection(w);
  w.drawFooter();

  return doc.save();
}

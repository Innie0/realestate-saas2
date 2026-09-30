/**
 * ZIP-level market price trend from Rentcast market statistics.
 *
 * Monthly median $/sqft across a whole ZIP is far steadier than a trend fitted to
 * the 10–30 comps near one house (whose mix of homes changes month to month).
 */

const RENTCAST_BASE = 'https://api.rentcast.io/v1';
const TREND_WINDOW_MONTHS = 12;
const TREND_MIN_MONTHS = 6;
const TREND_MAX_MONTHLY = 0.01;
/**
 * Below ~3.6%/yr the market is effectively flat and the fitted trend is mostly
 * noise — backtests in flat ZIPs were more accurate with no time adjustment.
 */
const TREND_MIN_MONTHLY = 0.003;

export interface MarketHistoryMonth {
  /** "YYYY-MM" */
  month: string;
  medianPricePerSqft: number;
}

/** Monthly median $/sqft history for a ZIP, preferring the subject's property type. */
export async function fetchZipMarketHistory(
  zipCode: string,
  apiKey: string,
  propertyType?: string | null,
  historyMonths = TREND_WINDOW_MONTHS + 1,
): Promise<MarketHistoryMonth[]> {
  if (!/^\d{5}$/.test(zipCode)) return [];
  try {
    const search = new URLSearchParams({
      zipCode,
      dataType: 'Sale',
      historyRange: String(historyMonths),
    });
    const res = await fetch(`${RENTCAST_BASE}/markets?${search}`, {
      headers: { 'X-Api-Key': apiKey, Accept: 'application/json' },
    });
    if (!res.ok) return [];
    return parseMarketHistory(await res.json(), propertyType);
  } catch {
    return [];
  }
}

export function parseMarketHistory(
  data: unknown,
  propertyType?: string | null,
): MarketHistoryMonth[] {
  const history = (data as { saleData?: { history?: Record<string, unknown> } })?.saleData?.history;
  if (!history || typeof history !== 'object') return [];

  const wantedType = propertyType?.trim().toLowerCase() ?? null;
  const months: MarketHistoryMonth[] = [];

  for (const [month, entry] of Object.entries(history)) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const byType = Array.isArray(e.dataByPropertyType)
      ? (e.dataByPropertyType as Record<string, unknown>[])
      : [];
    const typed = wantedType
      ? byType.find((t) => String(t.propertyType ?? '').toLowerCase() === wantedType)
      : undefined;
    const ppsf = Number((typed ?? e).medianPricePerSquareFoot);
    if (Number.isFinite(ppsf) && ppsf > 0) months.push({ month, medianPricePerSqft: ppsf });
  }

  return months.sort((a, b) => a.month.localeCompare(b.month));
}

function monthIndex(month: string): number {
  const [y, m] = month.split('-').map(Number);
  return y * 12 + (m - 1);
}

/**
 * Monthly price trend (0.004 = +0.4%/mo) from the 12 months up to `asOf`:
 * Theil–Sen slope of log median $/sqft. Null when history is too short or the
 * market is flat.
 */
export function trendFromMarketHistory(
  history: MarketHistoryMonth[],
  asOf: Date = new Date(),
): number | null {
  const end = asOf.getUTCFullYear() * 12 + asOf.getUTCMonth();
  const points = history
    .map((h) => ({ t: monthIndex(h.month), y: Math.log(h.medianPricePerSqft) }))
    // Only months fully known at the valuation date
    .filter((p) => p.t < end && p.t >= end - TREND_WINDOW_MONTHS);

  if (points.length < TREND_MIN_MONTHS) return null;

  const slopes: number[] = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dt = points[j].t - points[i].t;
      if (dt !== 0) slopes.push((points[j].y - points[i].y) / dt);
    }
  }
  if (slopes.length === 0) return null;
  slopes.sort((a, b) => a - b);
  const monthly = Math.exp(slopes[Math.floor(slopes.length / 2)]) - 1;
  if (Math.abs(monthly) < TREND_MIN_MONTHLY) return null;
  return Math.max(-TREND_MAX_MONTHLY, Math.min(TREND_MAX_MONTHLY, monthly));
}

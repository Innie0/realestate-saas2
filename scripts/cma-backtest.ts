/**
 * CMA accuracy backtest ("scorecard").
 *
 * Takes homes that recently sold in a ZIP, values each one using only sales that
 * closed BEFORE it sold, and compares the CMA price to the actual sale price.
 * Runs the same filtering, scoring, selection and valuation code as the app.
 *
 * Usage:
 *   npm run cma:backtest -- --zip 85251
 *   npm run cma:backtest -- --zip 85251 --n 100 --radius 0.75 --type "Single Family"
 *
 * Options:
 *   --zip        ZIP code to test (required)
 *   --n          number of test homes (default 50)
 *   --test-days  test homes sold within this many days (default 180)
 *   --years      comp lookback in years, like the app's "years back" (default 1)
 *   --radius     comp search radius in miles, like the app (default 0.5)
 *   --type       property type (default "Single Family")
 *   --no-cache   ignore cached Rentcast responses
 *
 * Rentcast usage: ~3–8 API calls per run (ZIP sales, ZIP market history, and a few
 * pages of nearby sales). Responses are cached in scripts/.cache so re-runs cost nothing.
 *
 * Limits: active listings can't be replayed historically, so this measures the
 * closed-sale path only. Public records keep only each home's latest sale, so a
 * comp that resold after the test date drops out of that test's pool.
 */

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  calculateCma,
  valueFromSelectedComps,
  type SubjectProperty,
} from '@/lib/cma';
import { addressesToSelectedComps, selectCompsBySimilarity } from '@/lib/cma-ai-comp-selection';
import {
  defaultSearchCriteriaFromSubject,
  filterCompsBySearchCriteria,
} from '@/lib/cma-search-criteria';
import { filterSoldComps, mapRawComp } from '@/lib/comp-filters';
import { distanceMiles, rawCompFromPropertyRecord } from '@/lib/comp-fetch';
import {
  parseMarketHistory,
  trendFromMarketHistory,
  type MarketHistoryMonth,
} from '@/lib/market-trend';

const RENTCAST_BASE = 'https://api.rentcast.io/v1';
const CACHE_DIR = join(process.cwd(), 'scripts/.cache/rentcast');
const OUTPUT_DIR = join(process.cwd(), 'scripts/output');
const PAGE_LIMIT = 500;
const MAX_POOL_PAGES = 6;
const MIN_RAW_COMPS = 8;

// ── args ─────────────────────────────────────────────────────────────────────

function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (name: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const zip = get('zip');
  if (!zip || !/^\d{5}$/.test(zip)) {
    console.error('Usage: npm run cma:backtest -- --zip 85251 [--n 50] [--radius 0.5] [--years 1]');
    process.exit(1);
  }
  return {
    zip,
    n: Number(get('n') ?? 50),
    testDays: Number(get('test-days') ?? 180),
    lookbackDays: Math.round(Number(get('years') ?? 1) * 365),
    radius: Number(get('radius') ?? 0.5),
    propertyType: get('type') ?? 'Single Family',
    useCache: !argv.includes('--no-cache'),
  };
}

// ── Rentcast with disk cache ─────────────────────────────────────────────────

let apiCalls = 0;

async function rentcast(
  path: string,
  params: Record<string, string>,
  useCache: boolean,
): Promise<Record<string, unknown>[]> {
  const data = await rentcastObject(path, params, useCache);
  return Array.isArray(data) ? data : [];
}

async function rentcastObject(
  path: string,
  params: Record<string, string>,
  useCache: boolean,
): Promise<unknown> {
  const search = new URLSearchParams(params);
  const cacheKey = createHash('sha1').update(`${path}?${search}`).digest('hex');
  const cacheFile = join(CACHE_DIR, `${cacheKey}.json`);
  if (useCache && existsSync(cacheFile)) {
    return JSON.parse(readFileSync(cacheFile, 'utf8'));
  }

  const key = process.env.RENTCAST_API_KEY;
  if (!key) throw new Error('RENTCAST_API_KEY is not set (expected in .env.local)');

  apiCalls++;
  const res = await fetch(`${RENTCAST_BASE}${path}?${search}`, {
    headers: { 'X-Api-Key': key, Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Rentcast ${path} failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cacheFile, JSON.stringify(data));
  return data;
}

async function fetchAllPages(
  params: Record<string, string>,
  useCache: boolean,
): Promise<Record<string, unknown>[]> {
  const all: Record<string, unknown>[] = [];
  for (let page = 0; page < MAX_POOL_PAGES; page++) {
    const rows = await rentcast(
      '/properties',
      { ...params, limit: String(PAGE_LIMIT), offset: String(page * PAGE_LIMIT) },
      useCache,
    );
    all.push(...rows);
    if (rows.length < PAGE_LIMIT) break;
  }
  return all;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function subjectFromRecord(r: Record<string, unknown>): SubjectProperty {
  const f = (r.features ?? {}) as Record<string, unknown>;
  return {
    bedrooms: num(r.bedrooms),
    bathrooms: num(r.bathrooms),
    squareFootage: num(r.squareFootage),
    lotSize: num(r.lotSize),
    yearBuilt: num(r.yearBuilt),
    condition: 'average',
    hasPool: f.pool === true,
    garageSpaces: num(f.garageSpaces) ?? (f.garage === true ? 1 : 0),
  };
}

/** Deterministic shuffle so repeated runs test the same homes. */
function stableSample<T extends Record<string, unknown>>(rows: T[], n: number): T[] {
  const hash = (r: T) =>
    createHash('sha1').update(String(r.id ?? r.formattedAddress)).digest('hex');
  return [...rows].sort((a, b) => hash(a).localeCompare(hash(b))).slice(0, n);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const pct = (v: number | null) => (v === null ? '—' : `${(v * 100).toFixed(1)}%`);
const csvCell = (v: unknown) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// ── valuation (mirrors /api/market-analysis) ─────────────────────────────────

function valueAsOf(
  subjectRecord: Record<string, unknown>,
  pool: Record<string, unknown>[],
  opts: {
    radius: number;
    lookbackDays: number;
    marketHistory: MarketHistoryMonth[] | null;
  },
) {
  const subject = subjectFromRecord(subjectRecord);
  const asOf = new Date(String(subjectRecord.lastSaleDate));
  const lat = subjectRecord.latitude as number;
  const lng = subjectRecord.longitude as number;
  const subjectAddress = String(subjectRecord.formattedAddress ?? '');

  const poolWithin = (radius: number, days: number) => {
    const earliest = asOf.getTime() - days * 86_400_000;
    return pool
      .filter((r) => r.id !== subjectRecord.id)
      .map((r) => rawCompFromPropertyRecord(r, { latitude: lat, longitude: lng }))
      .filter((r) => {
        const sold = Date.parse(String(r.soldDate ?? ''));
        return (
          typeof r.distance === 'number' &&
          r.distance <= radius &&
          Number.isFinite(sold) &&
          sold >= earliest
        );
      });
  };

  // Same sparse-market widening as fetchCompsWithFallback
  let raw = poolWithin(opts.radius, opts.lookbackDays);
  let { included } = filterSoldComps(raw, { subjectAddress, asOf });
  let widened = false;
  if (included.length < MIN_RAW_COMPS) {
    const wider = poolWithin(
      Math.min(opts.radius * 2, 2),
      Math.min(Math.round(opts.lookbackDays * 1.5), 1095),
    );
    const widerIncluded = filterSoldComps(wider, { subjectAddress, asOf }).included;
    if (widerIncluded.length > included.length) {
      raw = wider;
      included = widerIncluded;
      widened = true;
    }
  }

  const criteria = defaultSearchCriteriaFromSubject(subject);
  const { qualified } = filterCompsBySearchCriteria(included, criteria);
  const comps = qualified.map(mapRawComp);

  // Only market history known at the sale date is used
  const marketTrend = opts.marketHistory ? trendFromMarketHistory(opts.marketHistory, asOf) : null;
  const { scoredComps } = calculateCma(subject, comps, {
    asOf,
    marketTrend,
  });
  const { selectedAddresses } = selectCompsBySimilarity(scoredComps, { includeActive: false });
  const marked = addressesToSelectedComps(scoredComps, selectedAddresses);
  const { valuation } = valueFromSelectedComps(subject, marked);

  return {
    suggestedPrice: valuation.suggestedPrice,
    priceLow: valuation.priceLow,
    priceHigh: valuation.priceHigh,
    compCount: valuation.compCount,
    poolSize: qualified.length,
    trend: marketTrend,
    widened,
  };
}

// ── main ─────────────────────────────────────────────────────────────────────

interface Row {
  address: string;
  soldDate: string;
  actual: number;
  estimate: number | null;
  errorPct: number | null;
  estimateTimeAdj: number | null;
  errorPctTimeAdj: number | null;
  inRange: boolean | null;
  compCount: number;
  poolSize: number;
  trend: number | null;
  widened: boolean;
}

function summarize(errors: number[], total: number) {
  const abs = errors.map(Math.abs);
  return {
    valued: errors.length,
    coverage: total ? errors.length / total : 0,
    medianAbsError: median(abs),
    meanSignedError: errors.length ? errors.reduce((a, b) => a + b, 0) / errors.length : null,
    within5: errors.length ? abs.filter((e) => e <= 0.05).length / errors.length : null,
    within10: errors.length ? abs.filter((e) => e <= 0.1).length / errors.length : null,
    within20: errors.length ? abs.filter((e) => e <= 0.2).length / errors.length : null,
  };
}

async function main() {
  const args = parseArgs();
  console.log(
    `CMA backtest — ZIP ${args.zip}, ${args.propertyType}, radius ${args.radius} mi, ` +
      `${args.lookbackDays}-day lookback, up to ${args.n} homes sold in the last ${args.testDays} days\n`,
  );

  // 1. Test homes: recent recorded sales in the ZIP
  const recent = await fetchAllPages(
    {
      zipCode: args.zip,
      propertyType: args.propertyType,
      saleDateRange: String(args.testDays),
    },
    args.useCache,
  );
  const eligible = recent.filter(
    (r) =>
      (num(r.lastSalePrice) ?? 0) >= 10_000 &&
      (num(r.squareFootage) ?? 0) > 0 &&
      num(r.latitude) !== null &&
      num(r.longitude) !== null &&
      typeof r.lastSaleDate === 'string',
  );
  if (eligible.length === 0) {
    console.error(
      'No recorded sales with prices found. This ZIP may be in a non-disclosure state ' +
        '(e.g. TX, UT, ID, NM, WY, ND, MS, MT, KS, AK) — try a ZIP elsewhere.',
    );
    process.exit(1);
  }
  const tests = stableSample(eligible, args.n);

  // 2. Comp pool: every sale near the test homes over the full window (one query)
  const center = {
    lat: tests.reduce((s, r) => s + (r.latitude as number), 0) / tests.length,
    lng: tests.reduce((s, r) => s + (r.longitude as number), 0) / tests.length,
  };
  const spread = Math.max(
    ...tests.map((r) =>
      distanceMiles(center.lat, center.lng, r.latitude as number, r.longitude as number),
    ),
  );
  const poolRadius = Math.min(Math.ceil((spread + Math.min(args.radius * 2, 2)) * 10) / 10, 10);
  const poolDays = args.testDays + Math.min(Math.round(args.lookbackDays * 1.5), 1095);
  const pool = await fetchAllPages(
    {
      latitude: center.lat.toFixed(5),
      longitude: center.lng.toFixed(5),
      radius: String(poolRadius),
      propertyType: args.propertyType,
      saleDateRange: String(poolDays),
    },
    args.useCache,
  );
  console.log(
    `Test homes: ${tests.length} (of ${eligible.length} eligible). ` +
      `Comp pool: ${pool.length} sales within ${poolRadius} mi. Rentcast calls this run: ${apiCalls}\n`,
  );

  // 3. ZIP market history for time adjustments (12 months before the oldest test sale)
  const oldestTest = Math.min(...tests.map((t) => Date.parse(String(t.lastSaleDate))));
  const historyMonths = Math.ceil((Date.now() - oldestTest) / (30.44 * 86_400_000)) + 13;
  const marketRaw = await rentcastObject(
    '/markets',
    { zipCode: args.zip, dataType: 'Sale', historyRange: String(historyMonths) },
    args.useCache,
  );
  const marketHistory = parseMarketHistory(marketRaw, args.propertyType);

  // 4. Value each test home as of its sale date
  const rows: Row[] = tests.map((t) => {
    const actual = t.lastSalePrice as number;
    const opts = { radius: args.radius, lookbackDays: args.lookbackDays };
    // The app doesn't apply a time adjustment; the ZIP-trend variant is experimental
    const current = valueAsOf(t, pool, { ...opts, marketHistory: null });
    const withTime = valueAsOf(t, pool, { ...opts, marketHistory });
    const err = (est: number | null) => (est ? (est - actual) / actual : null);
    return {
      address: String(t.formattedAddress),
      soldDate: String(t.lastSaleDate).slice(0, 10),
      actual,
      estimate: current.suggestedPrice,
      errorPct: err(current.suggestedPrice),
      estimateTimeAdj: withTime.suggestedPrice,
      errorPctTimeAdj: err(withTime.suggestedPrice),
      inRange:
        current.priceLow !== null && current.priceHigh !== null
          ? actual >= current.priceLow && actual <= current.priceHigh
          : null,
      compCount: current.compCount,
      poolSize: current.poolSize,
      trend: withTime.trend,
      widened: current.widened,
    };
  });

  // 5. Report
  const current = summarize(
    rows.map((r) => r.errorPct).filter((e): e is number => e !== null),
    rows.length,
  );
  const timeAdj = summarize(
    rows.map((r) => r.errorPctTimeAdj).filter((e): e is number => e !== null),
    rows.length,
  );
  const ranged = rows.filter((r) => r.inRange !== null);
  const inRangeRate = ranged.length ? ranged.filter((r) => r.inRange).length / ranged.length : null;

  console.log('                         Current CMA   + ZIP time adj. (experimental)');
  const line = (label: string, a: string, b: string) =>
    console.log(`${label.padEnd(25)}${a.padEnd(14)}${b}`);
  line('Homes valued', `${current.valued}/${rows.length}`, `${timeAdj.valued}/${rows.length}`);
  line('Typical error (median)', pct(current.medianAbsError), pct(timeAdj.medianAbsError));
  line('Bias (+ = too high)', pct(current.meanSignedError), pct(timeAdj.meanSignedError));
  line('Within 5%', pct(current.within5), pct(timeAdj.within5));
  line('Within 10%', pct(current.within10), pct(timeAdj.within10));
  line('Within 20%', pct(current.within20), pct(timeAdj.within20));
  line('Sale price inside range', pct(inRangeRate), '');

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const csvPath = join(OUTPUT_DIR, `cma-backtest-${args.zip}-${stamp}.csv`);
  const header = Object.keys(rows[0]) as (keyof Row)[];
  writeFileSync(
    csvPath,
    [header.join(','), ...rows.map((r) => header.map((h) => csvCell(r[h])).join(','))].join('\n'),
  );
  console.log(`\nPer-home results: ${csvPath}`);
  console.log(`Rentcast API calls used: ${apiCalls}${apiCalls === 0 ? ' (all cached)' : ''}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

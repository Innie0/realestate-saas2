'use client';

import {
  searchCriteriaCacheSuffix,
  type CmaSearchCriteria,
} from '@/lib/cma-search-criteria';

const STORAGE_KEY = 'oikaro_research_cache_v1';
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  payload: T;
  expiresAt: number;
  savedAt: number;
}

type CacheStore = Record<string, CacheEntry<unknown>>;

function readStore(): CacheStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CacheStore;
  } catch {
    return {};
  }
}

function writeStore(store: CacheStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota exceeded — non-fatal */
  }
}

export function getLocalResearchCache<T>(key: string): T | null {
  const store = readStore();
  const entry = store[key] as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    delete store[key];
    writeStore(store);
    return null;
  }
  return entry.payload;
}

export function setLocalResearchCache<T>(
  key: string,
  payload: T,
  ttlMs = DEFAULT_TTL_MS
): void {
  const store = readStore();
  store[key] = {
    payload,
    expiresAt: Date.now() + ttlMs,
    savedAt: Date.now(),
  };
  writeStore(store);
}

export function lookupLocalCacheKey(addressKey: string): string {
  return `${addressKey}::lookup`;
}

export function cmaLocalCacheKey(
  addressKey: string,
  params: {
    propertyType?: string;
    radius?: number;
    yearsBack?: number;
    searchCriteria?: CmaSearchCriteria;
    includeActiveListings?: boolean;
  }
): string {
  const pt = params.propertyType || 'auto';
  const radius = params.radius ?? 0.5;
  const years = params.yearsBack ?? 1;
  const criteria = params.searchCriteria
    ? searchCriteriaCacheSuffix(params.searchCriteria)
    : 'default';
  const active = params.includeActiveListings === false ? 'sold' : 'sold+active';
  return `${addressKey}::cma::${pt}::${radius}::${years}::${criteria}::${active}`;
}

/** Return the most recently saved CMA cache entry for an address (any radius/type). */
export function findLatestCmaCache<T>(addressKey: string): T | null {
  const store = readStore();
  const prefix = `${addressKey}::cma::`;
  const now = Date.now();
  let best: CacheEntry<T> | null = null;

  for (const [key, entry] of Object.entries(store)) {
    if (!key.startsWith(prefix)) continue;
    const typed = entry as CacheEntry<T>;
    if (now > typed.expiresAt) continue;
    if (!best || typed.savedAt > best.savedAt) best = typed;
  }

  return best?.payload ?? null;
}

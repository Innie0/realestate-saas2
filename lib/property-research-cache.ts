/**
 * Cache property research API responses to reduce Rentcast/BatchData usage.
 * Requires property_research_cache table (see property-research-cache.sql).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  searchCriteriaCacheSuffix,
  type CmaSearchCriteria,
} from '@/lib/cma-search-criteria';

export type ResearchCacheType = 'property_lookup' | 'market_analysis' | 'market_prefill';

const DEFAULT_TTL_DAYS = 7;

export function normalizeAddressKey(parts: {
  street: string;
  city?: string;
  state: string;
  zip?: string;
}): string {
  return [parts.street, parts.city ?? '', parts.state, parts.zip ?? '']
    .map((s) => String(s).trim().toLowerCase())
    .filter(Boolean)
    .join('|')
    .replace(/\s+/g, ' ');
}

export function marketAnalysisCacheKey(
  addressKey: string,
  params: {
    propertyType?: string;
    radius?: number;
    yearsBack?: number;
    searchCriteria?: CmaSearchCriteria;
  }
): string {
  const pt = params.propertyType || 'auto';
  const radius = params.radius ?? 0.5;
  const years = params.yearsBack ?? 1;
  const criteria = params.searchCriteria
    ? searchCriteriaCacheSuffix(params.searchCriteria)
    : 'default';
  return `${addressKey}::cma::${pt}::${radius}::${years}::${criteria}`;
}

export function marketPrefillCacheKey(addressKey: string): string {
  return `${addressKey}::prefill`;
}

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? '').toLowerCase();
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    msg.includes('property_research_cache') ||
    msg.includes('does not exist')
  );
}

export async function getResearchCache<T>(
  supabase: SupabaseClient,
  userId: string,
  cacheType: ResearchCacheType,
  cacheKey: string
): Promise<T | null> {
  try {
    const { data, error } = await supabase
      .from('property_research_cache')
      .select('payload, expires_at')
      .eq('user_id', userId)
      .eq('cache_type', cacheType)
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) return null;
      console.warn('Research cache read failed:', error.message);
      return null;
    }

    if (!data?.payload) return null;
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null;
    }

    return data.payload as T;
  } catch {
    return null;
  }
}

export async function setResearchCache(
  supabase: SupabaseClient,
  userId: string,
  cacheType: ResearchCacheType,
  cacheKey: string,
  payload: unknown,
  ttlDays = DEFAULT_TTL_DAYS
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    const { error } = await supabase.from('property_research_cache').upsert(
      {
        user_id: userId,
        cache_type: cacheType,
        cache_key: cacheKey,
        payload,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,cache_type,cache_key' }
    );

    if (error && !isMissingTableError(error)) {
      console.warn('Research cache write failed:', error.message);
    }
  } catch {
    /* non-fatal */
  }
}

import { revalidateTag } from 'next/cache';
import {
  fetchRentcastActiveListing,
  fetchRentcastInactiveListing,
  isRentcastConfigured,
} from '@/lib/rentcast-listings';
import type { PropertyInfo } from '@/types';

export type ListingStatus = 'active' | 'sold' | 'off_market' | 'unknown';

export type ListingSyncAction =
  | 'unchanged'
  | 'price_updated'
  | 'marked_sold'
  | 'marked_off_market'
  | 'needs_review'
  | 'skipped'
  | 'error';

export type ListingSyncResult = {
  projectId: string;
  title: string;
  action: ListingSyncAction;
  message?: string;
  previousPrice?: number | null;
  newPrice?: number | null;
};

type SyncableProject = {
  id: string;
  user_id: string;
  title: string;
  published?: boolean | null;
  property_info?: PropertyInfo | null;
  listing_status?: string | null;
};

type SupabaseLike = {
  from: (table: string) => {
    update: (values: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
  };
};

function addressParts(info: PropertyInfo | null | undefined) {
  const street = info?.address?.trim() || '';
  const city = info?.city?.trim() || '';
  const state = info?.state?.trim() || '';
  const zip = info?.zip_code?.trim() || '';
  return { street, city, state, zip };
}

export async function syncProjectListing(
  supabase: SupabaseLike,
  project: SyncableProject
): Promise<ListingSyncResult> {
  const base = {
    projectId: project.id,
    title: project.title,
  };

  if (!isRentcastConfigured()) {
    return {
      ...base,
      action: 'error',
      message: 'RENTCAST_API_KEY is not configured',
    };
  }

  const info = (project.property_info || {}) as PropertyInfo;
  const { street, city, state, zip } = addressParts(info);

  if (!street || !state) {
    return {
      ...base,
      action: 'skipped',
      message: 'Missing street address or state',
    };
  }

  const previousPrice =
    typeof info.price === 'number' && info.price > 0 ? info.price : null;

  try {
    const active = await fetchRentcastActiveListing(street, city, state, zip);

    if (active) {
      const rentcastPrice =
        typeof active.price === 'number' && active.price > 0 ? active.price : null;
      const priceChanged =
        rentcastPrice != null && rentcastPrice !== previousPrice;

      const nextInfo: PropertyInfo = { ...info };
      if (rentcastPrice != null) {
        nextInfo.price = rentcastPrice;
      }

      const { error } = await supabase
        .from('projects')
        .update({
          listing_status: 'active',
          last_synced_at: new Date().toISOString(),
          property_info: nextInfo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);

      if (error) {
        return { ...base, action: 'error', message: error.message };
      }

      if (priceChanged) {
        return {
          ...base,
          action: 'price_updated',
          previousPrice,
          newPrice: rentcastPrice,
          message: `Price updated to $${rentcastPrice!.toLocaleString()}`,
        };
      }

      return { ...base, action: 'unchanged', message: 'Still active on Rentcast' };
    }

    const inactive = await fetchRentcastInactiveListing(street, city, state, zip);

    if (inactive) {
      const statusText = (inactive.status || '').toLowerCase();
      const isSold =
        statusText.includes('sold') ||
        statusText.includes('closed') ||
        Boolean(inactive.removedDate);

      const listingStatus: ListingStatus = isSold ? 'sold' : 'off_market';
      const wasPublished = Boolean(project.published);

      const { error } = await supabase
        .from('projects')
        .update({
          listing_status: listingStatus,
          last_synced_at: new Date().toISOString(),
          published: false,
          published_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);

      if (error) {
        return { ...base, action: 'error', message: error.message };
      }

      return {
        ...base,
        action: isSold ? 'marked_sold' : 'marked_off_market',
        message: wasPublished
          ? isSold
            ? 'Marked sold and removed from marketplace'
            : 'No longer active — removed from marketplace'
          : isSold
            ? 'Marked sold'
            : 'Marked off market',
      };
    }

    const { error } = await supabase
      .from('projects')
      .update({
        listing_status: 'unknown',
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', project.id);

    if (error) {
      return { ...base, action: 'error', message: error.message };
    }

    return {
      ...base,
      action: 'needs_review',
      message: 'Not found on Rentcast — review manually',
    };
  } catch (err) {
    return {
      ...base,
      action: 'error',
      message: err instanceof Error ? err.message : 'Sync failed',
    };
  }
}

export async function syncPublishedProjects(
  supabase: SupabaseLike,
  projects: SyncableProject[]
): Promise<{ results: ListingSyncResult[]; changed: boolean }> {
  const results: ListingSyncResult[] = [];
  let changed = false;

  for (const project of projects) {
    const result = await syncProjectListing(supabase, project);
    results.push(result);
    if (
      result.action === 'price_updated' ||
      result.action === 'marked_sold' ||
      result.action === 'marked_off_market'
    ) {
      changed = true;
    }
    // Small delay to avoid hammering Rentcast
    await new Promise((r) => setTimeout(r, 250));
  }

  if (changed) {
    revalidateTag('marketplace-listings', { expire: 0 });
  }

  return { results, changed };
}

export function summarizeSyncResults(results: ListingSyncResult[]) {
  return {
    total: results.length,
    priceUpdated: results.filter((r) => r.action === 'price_updated').length,
    sold: results.filter((r) => r.action === 'marked_sold').length,
    offMarket: results.filter((r) => r.action === 'marked_off_market').length,
    needsReview: results.filter((r) => r.action === 'needs_review').length,
    errors: results.filter((r) => r.action === 'error').length,
    skipped: results.filter((r) => r.action === 'skipped').length,
    unchanged: results.filter((r) => r.action === 'unchanged').length,
  };
}

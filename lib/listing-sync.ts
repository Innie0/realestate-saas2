import { revalidateTag } from 'next/cache';
import {
  fetchRentcastActiveListing,
  fetchRentcastInactiveListing,
  fetchRentcastProperty,
  isRentcastConfigured,
  type RentcastPropertyRecord,
  type RentcastSaleListing,
} from '@/lib/rentcast-listings';
import type { PropertyInfo } from '@/types';

export type ListingStatus = 'active' | 'sold' | 'off_market' | 'unknown';

export type ListingSyncAction =
  | 'unchanged'
  | 'listing_updated'
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
  updatedFields?: string[];
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

function positiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

function bedsBathsNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function numbersEqual(a: number | null | undefined, b: number | null | undefined): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(a - b) < 0.01;
}

function pickRentcastDetails(
  listing: RentcastSaleListing,
  property: RentcastPropertyRecord | null
): {
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
} {
  return {
    price: positiveNumber(listing.price),
    bedrooms: bedsBathsNumber(listing.bedrooms) ?? bedsBathsNumber(property?.bedrooms),
    bathrooms: bedsBathsNumber(listing.bathrooms) ?? bedsBathsNumber(property?.bathrooms),
    squareFeet:
      positiveNumber(listing.squareFootage) ?? positiveNumber(property?.squareFootage),
  };
}

function applyRentcastDetails(
  info: PropertyInfo,
  details: ReturnType<typeof pickRentcastDetails>
): { nextInfo: PropertyInfo; updatedFields: string[] } {
  const nextInfo: PropertyInfo = { ...info };
  const updatedFields: string[] = [];

  if (details.price != null && !numbersEqual(info.price, details.price)) {
    nextInfo.price = details.price;
    updatedFields.push('price');
  }

  if (details.bedrooms != null && !numbersEqual(info.bedrooms, details.bedrooms)) {
    nextInfo.bedrooms = Math.round(details.bedrooms);
    updatedFields.push('bedrooms');
  }

  if (details.bathrooms != null && !numbersEqual(info.bathrooms, details.bathrooms)) {
    nextInfo.bathrooms = details.bathrooms;
    updatedFields.push('bathrooms');
  }

  if (details.squareFeet != null && !numbersEqual(info.square_feet, details.squareFeet)) {
    nextInfo.square_feet = Math.round(details.squareFeet);
    updatedFields.push('square feet');
  }

  return { nextInfo, updatedFields };
}

function formatSyncUpdateMessage(updatedFields: string[], newPrice: number | null): string {
  if (updatedFields.length === 0) return 'Still active on Rentcast';

  const parts = updatedFields.map((field) => {
    if (field === 'price' && newPrice != null) {
      return `price → $${newPrice.toLocaleString()}`;
    }
    return field;
  });

  return `Updated ${parts.join(', ')}`;
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
      const listingMissingDetails =
        active.bedrooms == null ||
        active.bathrooms == null ||
        active.squareFootage == null;

      const property = listingMissingDetails
        ? await fetchRentcastProperty(street, city, state, zip)
        : null;

      const details = pickRentcastDetails(active, property);
      const { nextInfo, updatedFields } = applyRentcastDetails(info, details);

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

      if (updatedFields.length > 0) {
        const newPrice =
          details.price != null && updatedFields.includes('price') ? details.price : null;
        return {
          ...base,
          action: 'listing_updated',
          previousPrice: updatedFields.includes('price') ? previousPrice : undefined,
          newPrice,
          updatedFields,
          message: formatSyncUpdateMessage(updatedFields, details.price),
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
      result.action === 'listing_updated' ||
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
    listingUpdated: results.filter((r) => r.action === 'listing_updated').length,
    sold: results.filter((r) => r.action === 'marked_sold').length,
    offMarket: results.filter((r) => r.action === 'marked_off_market').length,
    needsReview: results.filter((r) => r.action === 'needs_review').length,
    errors: results.filter((r) => r.action === 'error').length,
    skipped: results.filter((r) => r.action === 'skipped').length,
    unchanged: results.filter((r) => r.action === 'unchanged').length,
  };
}

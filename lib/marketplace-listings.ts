import { createAdminClient } from '@/lib/supabase-admin';
import { formatListingAddress, normalizeProjectImages } from '@/lib/listing-utils';
import type { Project, PropertyInfo } from '@/types';

export type MarketplaceListing = {
  id: string;
  title: string;
  address: string;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  price: number | null;
  propertyType: Project['property_type'] | null;
  thumb: string | null;
  beds: number | null;
  baths: number | null;
  squareFeet: number | null;
  publishedAt: string | null;
};

export type MarketplaceSort = 'newest' | 'price_asc' | 'price_desc';

export type MarketplaceFilters = {
  location?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  sort?: MarketplaceSort;
};

type ProjectRow = Pick<
  Project,
  'id' | 'title' | 'property_type' | 'property_info' | 'images' | 'published_at'
>;

export const MARKETPLACE_PROPERTY_TYPES = [
  { value: '', label: 'All types' },
  { value: 'house', label: 'House' },
  { value: 'condo', label: 'Condo' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
] as const;

function parseMarketplaceListing(row: ProjectRow): MarketplaceListing {
  const info = (row.property_info || {}) as PropertyInfo;
  return {
    id: row.id,
    title: row.title,
    address: formatListingAddress(info, row.title),
    city: info.city?.trim() || null,
    state: info.state?.trim() || null,
    zipCode: info.zip_code?.trim() || null,
    price: typeof info.price === 'number' && info.price > 0 ? info.price : null,
    propertyType: row.property_type ?? null,
    thumb: normalizeProjectImages(row.images)[0] ?? null,
    beds: typeof info.bedrooms === 'number' ? info.bedrooms : null,
    baths: typeof info.bathrooms === 'number' ? info.bathrooms : null,
    squareFeet: typeof info.square_feet === 'number' ? info.square_feet : null,
    publishedAt: row.published_at ?? null,
  };
}

export async function getPublishedMarketplaceListings(): Promise<MarketplaceListing[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, property_type, property_info, images, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false });

  if (error || !data) return [];

  return (data as ProjectRow[]).map(parseMarketplaceListing);
}

function matchesLocation(listing: MarketplaceListing, location: string): boolean {
  const needle = location.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    listing.address,
    listing.city,
    listing.state,
    listing.zipCode,
    listing.title,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(needle);
}

export function filterMarketplaceListings(
  listings: MarketplaceListing[],
  filters: MarketplaceFilters
): MarketplaceListing[] {
  let result = listings.filter((listing) => {
    if (filters.location && !matchesLocation(listing, filters.location)) return false;
    if (filters.type && listing.propertyType !== filters.type) return false;
    if (filters.minPrice != null && (listing.price == null || listing.price < filters.minPrice)) {
      return false;
    }
    if (filters.maxPrice != null && (listing.price == null || listing.price > filters.maxPrice)) {
      return false;
    }
    if (filters.beds != null && (listing.beds == null || listing.beds < filters.beds)) {
      return false;
    }
    if (filters.baths != null && (listing.baths == null || listing.baths < filters.baths)) {
      return false;
    }
    return true;
  });

  const sort = filters.sort ?? 'newest';
  result = [...result].sort((a, b) => {
    if (sort === 'price_asc') {
      return (a.price ?? Number.MAX_SAFE_INTEGER) - (b.price ?? Number.MAX_SAFE_INTEGER);
    }
    if (sort === 'price_desc') {
      return (b.price ?? 0) - (a.price ?? 0);
    }
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTime - aTime;
  });

  return result;
}

export function parseMarketplaceSearchParams(
  params: Record<string, string | string[] | undefined>
): MarketplaceFilters {
  const get = (key: string) => {
    const value = params[key];
    return typeof value === 'string' ? value.trim() : '';
  };

  const num = (key: string) => {
    const raw = get(key);
    if (!raw) return undefined;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const sortRaw = get('sort');
  const sort: MarketplaceSort =
    sortRaw === 'price_asc' || sortRaw === 'price_desc' ? sortRaw : 'newest';

  return {
    location: get('location') || undefined,
    type: get('type') || undefined,
    minPrice: num('minPrice'),
    maxPrice: num('maxPrice'),
    beds: num('beds'),
    baths: num('baths'),
    sort,
  };
}

export function buildMarketplaceSearchUrl(filters: MarketplaceFilters): string {
  const params = new URLSearchParams();
  if (filters.location) params.set('location', filters.location);
  if (filters.type) params.set('type', filters.type);
  if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice));
  if (filters.beds != null) params.set('beds', String(filters.beds));
  if (filters.baths != null) params.set('baths', String(filters.baths));
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
  const query = params.toString();
  return query ? `/?${query}` : '/';
}

import { createAdminClient } from '@/lib/supabase-admin';
import { formatListingAddress, normalizeProjectImages } from '@/lib/listing-utils';
import type { MarketplaceListing } from '@/lib/marketplace-shared';
import type { Project, PropertyInfo } from '@/types';

type ProjectRow = Pick<
  Project,
  'id' | 'title' | 'property_type' | 'property_info' | 'images' | 'published_at'
>;

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

/**
 * Listings an agent chose to show on their public profile. Only public listing
 * details leave the database — never notes, clients, or other project data.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProfileListingStatus, Project } from '@/types';
import { getListingDescription, normalizeProjectImages } from '@/lib/listing-utils';

export interface PublicListing {
  id: string;
  status: ProfileListingStatus;
  address: string;
  cityLine: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  photos: string[];
  description: string;
  listingUrl: string | null;
}

/** More than this many and the profile rotates through them; this many or fewer simply display. */
export const PROFILE_LISTINGS_ROTATE_AFTER = 3;
const MAX_PROFILE_LISTINGS = 12;

const STATUS_ORDER: Record<ProfileListingStatus, number> = { active: 0, pending: 1, sold: 2 };

/** Stored photos only (uploaded files); skips very large inline images from older projects. */
function publicPhotos(images: Project['images'] | null | undefined): string[] {
  return normalizeProjectImages(images)
    .filter((url) => /^https?:\/\//i.test(url))
    .slice(0, 12);
}

export async function getProfileListings(admin: SupabaseClient, userId: string): Promise<PublicListing[]> {
  const { data, error } = await admin
    .from('projects')
    .select('id, title, description, property_info, images, ai_content, profile_status, updated_at')
    .eq('user_id', userId)
    .not('profile_status', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(MAX_PROFILE_LISTINGS);

  // Before the profile_status column exists, profiles simply show no listings
  if (error || !data) return [];

  return data
    .map((p): PublicListing => {
      const info = (p.property_info ?? {}) as Project['property_info'];
      const num = (v: unknown) => (typeof v === 'number' && v > 0 ? v : null);
      const url = typeof info?.listing_url === 'string' && /^https?:\/\//i.test(info.listing_url) ? info.listing_url : null;
      return {
        id: p.id as string,
        status: p.profile_status as ProfileListingStatus,
        address: info?.address?.trim() || (p.title as string),
        cityLine: [info?.city, info?.state, info?.zip_code].filter(Boolean).join(', '),
        price: num(info?.price),
        bedrooms: num(info?.bedrooms),
        bathrooms: num(info?.bathrooms),
        squareFeet: num(info?.square_feet),
        photos: publicPhotos(p.images as Project['images']),
        description: getListingDescription({ description: p.description, ai_content: p.ai_content }),
        listingUrl: url,
      };
    })
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}

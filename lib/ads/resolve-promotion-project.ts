import type { SupabaseClient } from '@supabase/supabase-js';
import type { AdType } from '@/lib/ads/ad-draft-types';
import { getAdTypeLabel } from '@/lib/ads/ad-type-config';

interface ResolveProjectInput {
  projectId?: string | null;
  adType?: AdType | null;
  propertyDetails?: Record<string, string | number>;
  images?: Array<{ url: string; order: number }>;
}

function buildTitle(adType: AdType | null | undefined, details: Record<string, string | number>) {
  const address = String(details.address || details.areaName || '').trim();
  const label = adType ? getAdTypeLabel(adType) : 'Ad';
  if (address) return `${label} · ${address}`.slice(0, 120);
  return `${label} · ${new Date().toLocaleDateString('en-US')}`.slice(0, 120);
}

function buildPropertyInfo(details: Record<string, string | number>) {
  return {
    address: details.address ? String(details.address) : undefined,
    city: details.city ? String(details.city) : undefined,
    state: details.state ? String(details.state) : undefined,
    zip_code: details.zip ? String(details.zip) : undefined,
    price: details.price ? Number(details.price) || undefined : undefined,
    bedrooms: details.bedrooms ? Number(details.bedrooms) || undefined : undefined,
    bathrooms: details.bathrooms ? Number(details.bathrooms) || undefined : undefined,
  };
}

/**
 * Returns an owned project id for promotion — uses linked project or creates one from draft data.
 */
export async function resolvePromotionProjectId(
  supabase: SupabaseClient,
  userId: string,
  input: ResolveProjectInput
): Promise<{ projectId: string; created: boolean }> {
  if (input.projectId) {
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('id', input.projectId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      throw new Error('Project not found.');
    }
    return { projectId: data.id, created: false };
  }

  const details = input.propertyDetails ?? {};
  const imageUrls = (input.images ?? [])
    .sort((a, b) => a.order - b.order)
    .map((i) => i.url)
    .filter(Boolean);

  if (imageUrls.length === 0) {
    throw new Error('Add at least one photo before publishing.');
  }

  const title = buildTitle(input.adType, details);
  const property_info = buildPropertyInfo(details);

  const { data: created, error: insertError } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      title,
      property_info,
      images: imageUrls,
      status: 'draft',
      property_type: 'residential',
    })
    .select('id')
    .single();

  if (insertError || !created) {
    throw new Error('Could not save ad details. Try again.');
  }

  return { projectId: created.id, created: true };
}

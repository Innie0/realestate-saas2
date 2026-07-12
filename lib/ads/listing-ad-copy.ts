import { formatListingPrice, formatListingAddress, getListingDescription, normalizeProjectImages } from '@/lib/listing-utils';
import type { Project } from '@/types';

type PromotableProject = Pick<
  Project,
  'id' | 'title' | 'description' | 'property_info' | 'images' | 'ai_content' | 'published'
>;

export function getListingPublicUrl(projectId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://realestic.ai';
  return `${base.replace(/\/$/, '')}/listing/${projectId}`;
}

export function buildListingAdCopy(project: PromotableProject) {
  const info = project.property_info || {};
  const address = formatListingAddress(info, project.title);
  const price = formatListingPrice(info.price);
  const description = getListingDescription(project);
  const images = normalizeProjectImages(project.images);

  const beds = info.bedrooms ? `${info.bedrooms} bed` : null;
  const baths = info.bathrooms ? `${info.bathrooms} bath` : null;
  const specs = [beds, baths].filter(Boolean).join(' · ');

  const headline = specs ? `${address} — ${price}` : `${address} — ${price}`;
  const primaryText =
    description.length > 0
      ? description.slice(0, 180).trim() + (description.length > 180 ? '…' : '')
      : `Just listed at ${price}. ${specs ? `${specs}. ` : ''}View photos and schedule a showing.`;

  return {
    address,
    price,
    headline: headline.slice(0, 100),
    primaryText: primaryText.slice(0, 250),
    imageUrl: images[0] || null,
    zip: info.zip_code?.trim() || null,
    city: info.city?.trim() || null,
    state: info.state?.trim() || null,
  };
}

export function isProjectPromotable(project: PromotableProject): { ok: boolean; reason?: string } {
  if (!project.published) {
    return { ok: false, reason: 'Publish this listing on Realestic first.' };
  }
  const images = normalizeProjectImages(project.images);
  if (images.length === 0) {
    return { ok: false, reason: 'Add at least one photo before promoting.' };
  }
  const info = project.property_info || {};
  if (!info.address?.trim()) {
    return { ok: false, reason: 'Add a property address before promoting.' };
  }
  return { ok: true };
}

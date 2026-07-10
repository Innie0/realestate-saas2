import { formatCompactPrice } from '@/lib/format-price';
import type { AIGeneratedContent, Project, PropertyInfo } from '@/types';

export function normalizeProjectImages(
  images: Project['images'] | null | undefined
): string[] {
  if (!images?.length) return [];
  return images
    .map((img) => (typeof img === 'string' ? img : img?.url))
    .filter((url): url is string => Boolean(url));
}

export function getListingDescription(project: {
  description?: string | null;
  ai_content?: AIGeneratedContent | null;
}): string {
  const ai = project.ai_content;
  if (ai?.description?.trim()) return ai.description.trim();

  const tone = ai?.selected_tone || 'professional';
  const fromTone = ai?.tone_versions?.[tone]?.description;
  if (fromTone?.trim()) return fromTone.trim();

  return project.description?.trim() || '';
}

export function formatListingAddress(info: PropertyInfo | undefined, fallbackTitle: string): string {
  const line1 = info?.address?.trim() || fallbackTitle;
  const line2 = [info?.city, info?.state, info?.zip_code].filter(Boolean).join(', ');
  return line2 ? `${line1}, ${line2}` : line1;
}

export function formatListingPrice(price: number | undefined | null): string {
  if (price == null || price <= 0) return 'Price upon request';
  return formatCompactPrice(price);
}

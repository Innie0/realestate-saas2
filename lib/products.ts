/**
 * Product pages — edit copy & media in `lib/landing-features.ts` (LANDING_FEATURES array).
 *
 * Per product you can set:
 * - title, description, highlights, howItWorks — page copy
 * - imageSrc — PNG path under public/landing/ (e.g. `/landing/ai-assistant.png`)
 * - videoSrc — optional MP4/WebM under public/landing/videos/ (overrides image when file loads)
 * - cardSummary — one line on /products grid (defaults to description)
 * - metaDescription — SEO for /products/[slug] (defaults to description)
 * - published: false — hide from /products index until you are ready
 *
 * URLs: /products/[id]  e.g. /products/ai-assistant
 */

import {
  LANDING_FEATURES,
  type HowItWorksStep,
  type LandingFeature,
} from '@/lib/landing-features';
import { PRODUCT_CATEGORIES, type ProductCategory } from '@/lib/product-categories';

export type { HowItWorksStep, LandingFeature };

export { LANDING_FEATURES, PRODUCT_CATEGORIES };

export function getProductHref(id: string): string {
  return `/products/${id}`;
}

export function getProductBySlug(slug: string): LandingFeature | undefined {
  return LANDING_FEATURES.find((f) => f.id === slug);
}

export function getPublishedProducts(): LandingFeature[] {
  return LANDING_FEATURES.filter((f) => f.published !== false);
}

export function getAllProductSlugs(): string[] {
  return LANDING_FEATURES.map((f) => f.id);
}

export function getProductCardSummary(feature: LandingFeature): string {
  return feature.cardSummary ?? feature.description;
}

export function getProductMetaDescription(feature: LandingFeature): string {
  return feature.metaDescription ?? feature.description;
}

export function getProductCategory(featureId: string): ProductCategory | undefined {
  return PRODUCT_CATEGORIES.find((c) => c.featureIds.includes(featureId));
}

export function getRelatedProducts(featureId: string, limit = 3): LandingFeature[] {
  const category = getProductCategory(featureId);
  if (!category) return [];

  return category.featureIds
    .filter((id) => id !== featureId)
    .map((id) => getProductBySlug(id))
    .filter((f): f is LandingFeature => Boolean(f))
    .slice(0, limit);
}

/** Flat lookup for menus & links */
export const PRODUCTS_BY_ID = Object.fromEntries(
  LANDING_FEATURES.map((f) => [f.id, f]),
) as Record<string, LandingFeature>;

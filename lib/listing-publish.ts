import { getListingDescription, normalizeProjectImages } from '@/lib/listing-utils';
import type { Project } from '@/types';

export type PublishCheckItem = {
  id: string;
  label: string;
  ok: boolean;
  hint: string;
};

export type ListingPublishReadiness = {
  checks: PublishCheckItem[];
  ready: boolean;
  missingLabels: string[];
};

type PublishableProject = Pick<
  Project,
  'title' | 'description' | 'property_info' | 'images' | 'ai_content'
>;

export function getListingPublishReadiness(project: PublishableProject): ListingPublishReadiness {
  const info = project.property_info || {};
  const photoCount = normalizeProjectImages(project.images).length;
  const description = getListingDescription(project).trim();
  const hasAddress = Boolean(info.address?.trim() || project.title?.trim());
  const hasPrice = typeof info.price === 'number' && info.price > 0;
  const hasDescription = description.length >= 40;

  const checks: PublishCheckItem[] = [
    {
      id: 'photos',
      label: 'At least one photo',
      ok: photoCount >= 1,
      hint: 'Upload property photos in the gallery below.',
    },
    {
      id: 'address',
      label: 'Street address',
      ok: hasAddress,
      hint: 'Add the address in property details.',
    },
    {
      id: 'price',
      label: 'Listing price',
      ok: hasPrice,
      hint: 'Set a price so buyers can find your listing in search.',
    },
    {
      id: 'description',
      label: 'Property description',
      ok: hasDescription,
      hint: 'Write or generate a description buyers will read on Realestic.',
    },
  ];

  const missingLabels = checks.filter((c) => !c.ok).map((c) => c.label);

  return {
    checks,
    ready: missingLabels.length === 0,
    missingLabels,
  };
}

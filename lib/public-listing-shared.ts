import type { Project } from '@/types';

export type PublicListingAgent = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  headline: string | null;
  profilePath: string;
};

export type PublicListingProject = Pick<
  Project,
  'id' | 'title' | 'description' | 'property_info' | 'images' | 'ai_content'
>;

export type PublicListingData = {
  project: PublicListingProject;
  agent: PublicListingAgent;
};

/** Safe in-app return path from listing detail links (blocks open redirects). */
export function parseListingReturnTo(value: string | string[] | undefined): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

export function listingBackLabel(returnTo: string): string {
  return returnTo.includes('search=') ? 'Back to search' : 'Back to properties';
}

/**
 * Prefer MLS listing photos over Mapbox map thumbnails for CMA comps and subject.
 */

import { fetchListingPhotosByMlsNumbers } from '@/lib/mls-media';
import type { ScoredComp } from '@/lib/cma';
import type { CmaSubjectProfile } from '@/lib/subject-profile';

export interface EnrichCmaImagesResult {
  comps: ScoredComp[];
  subjectProfile: CmaSubjectProfile | null;
  listingPhotosFound: number;
}

export async function enrichCmaImages(params: {
  comps: ScoredComp[];
  subjectProfile: CmaSubjectProfile | null;
  subjectMlsNumber?: string | null;
}): Promise<EnrichCmaImagesResult> {
  const { comps, subjectProfile, subjectMlsNumber } = params;

  const mlsNumbers = [
    subjectMlsNumber,
    ...comps.map((c) => c.mlsNumber),
  ];

  const photoByMls = await fetchListingPhotosByMlsNumbers(mlsNumbers);
  if (photoByMls.size === 0) {
    return { comps, subjectProfile, listingPhotosFound: 0 };
  }

  let listingPhotosFound = 0;

  const enrichedComps = comps.map((comp) => {
    const mls = comp.mlsNumber?.trim();
    if (!mls) return comp;
    const listingPhoto = photoByMls.get(mls);
    if (!listingPhoto) return comp;
    listingPhotosFound += 1;
    return { ...comp, imageUrl: listingPhoto, imageSource: 'listing' as const };
  });

  let enrichedProfile = subjectProfile;
  const subjectMls = subjectMlsNumber?.trim();
  if (subjectProfile && subjectMls) {
    const subjectPhoto = photoByMls.get(subjectMls);
    if (subjectPhoto) {
      listingPhotosFound += 1;
      enrichedProfile = {
        ...subjectProfile,
        imageUrl: subjectPhoto,
        imageSource: 'listing',
      };
    }
  }

  return {
    comps: enrichedComps,
    subjectProfile: enrichedProfile,
    listingPhotosFound,
  };
}

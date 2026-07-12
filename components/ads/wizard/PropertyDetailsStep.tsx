'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useApi } from '@/lib/swr';
import { formatListingAddress, formatListingPrice, normalizeProjectImages } from '@/lib/listing-utils';
import { isProjectPromotable } from '@/lib/ads/listing-ad-copy';
import { getDetailFieldsForAdType } from '@/lib/ads/ad-type-config';
import type { AdDraft, AdDraftImage } from '@/lib/ads/ad-draft-types';
import { listingRequiredForAdType } from '@/lib/ads/ad-draft-types';
import AdImagePicker from '@/components/ads/wizard/AdImagePicker';
import type { Project } from '@/types';
import clsx from 'clsx';
import { Megaphone, User } from 'lucide-react';

interface AgentProfilePayload {
  profile_photo_url?: string | null;
  profile_bio?: string | null;
  profile_headline?: string | null;
}

interface PropertyDetailsStepProps {
  draft: AdDraft;
  onChange: (patch: Partial<AdDraft>) => void;
}

export default function PropertyDetailsStep({ draft, onChange }: PropertyDetailsStepProps) {
  const { data: projects = [], isLoading } = useApi<Project[]>('/api/projects');
  const { data: profile } = useApi<AgentProfilePayload | null>('/api/agent-profile');
  const fields = getDetailFieldsForAdType(draft.adType);
  const showListingPicker = draft.adType && listingRequiredForAdType(draft.adType);
  const isAgentBranding = draft.adType === 'agent_branding';

  const listingOptions = showListingPicker
    ? projects.filter((p) => isProjectPromotable(p).ok)
    : [];

  const setDetail = (key: string, value: string | number) => {
    onChange({
      propertyDetails: { ...draft.propertyDetails, [key]: value },
    });
  };

  const selectProject = (project: Project) => {
    const info = project.property_info || {};
    const images: AdDraftImage[] = normalizeProjectImages(project.images).map((url, order) => ({
      url,
      order,
    }));
    onChange({
      projectId: project.id,
      propertyDetails: {
        ...draft.propertyDetails,
        address: info.address || project.title,
        city: info.city || '',
        state: info.state || '',
        zip: info.zip_code || '',
        price: info.price || '',
        bedrooms: info.bedrooms || '',
        bathrooms: info.bathrooms || '',
      },
      images,
    });
  };

  useEffect(() => {
    if (!isAgentBranding || !profile) return;
    const patch: Partial<AdDraft> = {};
    const details = { ...draft.propertyDetails };
    let changed = false;
    if (!details.bioBlurb && profile.profile_bio) {
      details.bioBlurb = profile.profile_bio;
      changed = true;
    }
    if (!details.agentTagline && profile.profile_headline) {
      details.agentTagline = profile.profile_headline;
      changed = true;
    }
    if (changed) patch.propertyDetails = details;
    if (changed) onChange(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAgentBranding, profile?.profile_bio, profile?.profile_headline]);

  const useProfilePhoto = () => {
    if (!profile?.profile_photo_url) return;
    const exists = draft.images.some((i) => i.url === profile.profile_photo_url);
    if (exists) return;
    onChange({
      images: [{ url: profile.profile_photo_url, order: 0 }, ...draft.images.map((img, i) => ({ ...img, order: i + 1 }))],
    });
  };

  return (
    <div className="space-y-5">
      {showListingPicker && (
        <div>
          <p className="text-label mb-2">Link a property project</p>
          {isLoading ? (
            <p className="text-caption text-gray-500">Loading projects…</p>
          ) : listingOptions.length === 0 ? (
            <p className="text-[13px] text-gray-600 rounded-lg border border-dashed border-gray-200 px-4 py-3">
              Add a project with photos and an address first, or fill in details manually below.
            </p>
          ) : (
            <div className="grid gap-2 max-h-40 overflow-y-auto pr-1">
              {listingOptions.map((project) => {
                const info = project.property_info || {};
                const address = formatListingAddress(info, project.title);
                const price = formatListingPrice(info.price);
                const thumb = normalizeProjectImages(project.images)[0];
                const isSelected = draft.projectId === project.id;
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => selectProject(project)}
                    className={clsx(
                      'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150',
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    )}
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-gray-100">
                      {thumb ? (
                        <Image src={thumb} alt="" fill className="object-cover" sizes="40px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <Megaphone className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-gray-900 truncate">{address}</p>
                      <p className="text-[12px] text-gray-500 tabular-nums">{price}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {isAgentBranding && (
        <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 space-y-3">
          <p className="text-label flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" />
            Headshot
          </p>
          {profile?.profile_photo_url && (
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 rounded-full overflow-hidden ring-2 ring-white shadow">
                <Image src={profile.profile_photo_url} alt="" fill className="object-cover" sizes="56px" />
              </div>
              <Button variant="outline" size="sm" type="button" onClick={useProfilePhoto}>
                Use profile photo
              </Button>
            </div>
          )}
          <AdImagePicker
            draftId={draft.id}
            images={draft.images}
            onChange={(images) => onChange({ images, projectId: null })}
            label="Headshot & brand images"
            emptyHint="Upload your headshot or brand photo — drag, drop, or tap."
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
            {field.type === 'textarea' ? (
              <>
                <label className="text-[12px] font-medium text-gray-600 mb-1.5 block">
                  {field.label}
                </label>
                <textarea
                  value={String(draft.propertyDetails[field.key] ?? '')}
                  onChange={(e) => setDetail(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
                />
              </>
            ) : (
              <Input
                label={field.label}
                type={field.type}
                value={String(draft.propertyDetails[field.key] ?? '')}
                onChange={(e) =>
                  setDetail(
                    field.key,
                    field.type === 'number' ? Number(e.target.value) || '' : e.target.value
                  )
                }
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}
      </div>

      {!isAgentBranding && (
        <AdImagePicker
          draftId={draft.id}
          images={draft.images}
          onChange={(images) => onChange({ images })}
        />
      )}
    </div>
  );
}

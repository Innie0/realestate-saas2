'use client';

import Image from 'next/image';
import Input from '@/components/ui/Input';
import { useApi } from '@/lib/swr';
import { formatListingAddress, formatListingPrice, normalizeProjectImages } from '@/lib/listing-utils';
import { isProjectPromotable } from '@/lib/ads/listing-ad-copy';
import { getDetailFieldsForAdType } from '@/lib/ads/ad-type-config';
import type { AdDraft, AdDraftImage } from '@/lib/ads/ad-draft-types';
import { listingRequiredForAdType } from '@/lib/ads/ad-draft-types';
import AdImagePicker from '@/components/ads/wizard/AdImagePicker';
import type { Project } from '@/types';
import clsx from 'clsx';
import { Megaphone } from 'lucide-react';

interface PropertyDetailsStepProps {
  draft: AdDraft;
  onChange: (patch: Partial<AdDraft>) => void;
}

export default function PropertyDetailsStep({ draft, onChange }: PropertyDetailsStepProps) {
  const { data: projects = [], isLoading } = useApi<Project[]>('/api/projects');
  const fields = getDetailFieldsForAdType(draft.adType);
  const showListingPicker = draft.adType && listingRequiredForAdType(draft.adType);

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

      <AdImagePicker
        images={draft.images}
        onChange={(images) => onChange({ images })}
      />
    </div>
  );
}

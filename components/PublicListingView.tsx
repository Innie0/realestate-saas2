'use client';

import { useState } from 'react';
import {
  Bed,
  Bath,
  Square,
  MapPin,
  Home,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Project } from '@/types';
import {
  formatListingPrice,
  getListingDescription,
  normalizeProjectImages,
} from '@/lib/listing-utils';

interface PublicListingViewProps {
  project: Pick<Project, 'title' | 'property_info' | 'images' | 'ai_content' | 'description'>;
}

export default function PublicListingView({ project }: PublicListingViewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageUrls = normalizeProjectImages(project.images);
  const info = project.property_info || {};
  const description = getListingDescription(project);

  const nextImage = () => {
    if (imageUrls.length <= 1) return;
    setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
  };

  const prevImage = () => {
    if (imageUrls.length <= 1) return;
    setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  return (
    <div className="rounded-xl shadow-sm overflow-hidden border border-gray-200 bg-white">
      <div className="relative bg-gray-100">
        {imageUrls.length > 0 ? (
          <>
            <div className="aspect-[16/9] md:aspect-[21/9]">
              <img
                src={imageUrls[currentImageIndex]}
                alt="Property"
                className="w-full h-full object-cover"
              />
            </div>
            {imageUrls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 text-white text-xs rounded-full">
                  {currentImageIndex + 1} / {imageUrls.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="aspect-[16/9] flex items-center justify-center bg-gray-200">
            <div className="text-center text-gray-500">
              <Home className="w-12 h-12 mx-auto mb-2 opacity-60" />
              <p className="text-sm">No photos yet</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <div className="text-3xl md:text-4xl font-bold text-gray-900">
              {formatListingPrice(info.price)}
            </div>
            {info.price && info.square_feet ? (
              <div className="text-sm text-gray-500 mt-1">
                ${Math.round(info.price / info.square_feet).toLocaleString()}/sq ft
              </div>
            ) : null}
          </div>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200">
            For Sale
          </span>
        </div>

        <div className="flex flex-wrap gap-5 mb-5 py-4 border-y border-gray-200 text-gray-700">
          {info.bedrooms != null && (
            <div className="flex items-center gap-2">
              <Bed className="w-5 h-5 text-gray-400" />
              <span className="font-semibold text-gray-900">{info.bedrooms}</span>
              <span>beds</span>
            </div>
          )}
          {info.bathrooms != null && (
            <div className="flex items-center gap-2">
              <Bath className="w-5 h-5 text-gray-400" />
              <span className="font-semibold text-gray-900">{info.bathrooms}</span>
              <span>baths</span>
            </div>
          )}
          {info.square_feet != null && (
            <div className="flex items-center gap-2">
              <Square className="w-5 h-5 text-gray-400" />
              <span className="font-semibold text-gray-900">
                {info.square_feet.toLocaleString()}
              </span>
              <span>sq ft</span>
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 mb-6">
          <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {info.address || project.title}
            </div>
            {(info.city || info.state || info.zip_code) && (
              <div className="text-gray-600">
                {[info.city, info.state, info.zip_code].filter(Boolean).join(', ')}
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">About this home</h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">
            {description || 'Contact the agent for more details about this property.'}
          </p>
        </div>

        {project.ai_content?.key_features && project.ai_content.key_features.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Key features</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {project.ai_content.key_features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-gray-600 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

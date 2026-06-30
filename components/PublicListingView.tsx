'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Bed,
  Bath,
  Square,
  MapPin,
  Home,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
} from 'lucide-react';
import type { Project } from '@/types';
import type { PublicListingAgent } from '@/lib/public-listing-shared';
import ListingAgentCard from '@/components/listing/ListingAgentCard';
import {
  formatListingPrice,
  getListingDescription,
  normalizeProjectImages,
} from '@/lib/listing-utils';

interface PublicListingViewProps {
  project: Pick<Project, 'title' | 'property_info' | 'images' | 'ai_content' | 'description'>;
  agent: PublicListingAgent;
}

export default function PublicListingView({ project, agent }: PublicListingViewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const imageUrls = normalizeProjectImages(project.images);
  const info = project.property_info || {};
  const description = getListingDescription(project);

  const nextImage = useCallback(() => {
    if (imageUrls.length <= 1) return;
    setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
  }, [imageUrls.length]);

  const prevImage = useCallback(() => {
    if (imageUrls.length <= 1) return;
    setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
  }, [imageUrls.length]);

  const openLightbox = (index?: number) => {
    if (index != null) setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  useEffect(() => {
    if (!lightboxOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [lightboxOpen, nextImage, prevImage]);

  return (
    <div className="rounded-xl shadow-sm overflow-hidden border border-gray-200 bg-white">
      <div className="relative bg-gray-100">
        {imageUrls.length > 0 ? (
          <>
            <button
              type="button"
              onClick={() => openLightbox()}
              className="group relative block w-full aspect-[16/9] md:aspect-[21/9] cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              aria-label="View full-size photo"
            >
              <img
                src={imageUrls[currentImageIndex]}
                alt="Property"
                className="w-full h-full object-cover"
                decoding="async"
                fetchPriority="high"
                sizes="(max-width: 768px) 100vw, 768px"
              />
              <span className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-3.5 h-3.5" />
                Click to enlarge
              </span>
            </button>
            {imageUrls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
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

      {/* Full-screen photo lightbox */}
      {lightboxOpen && imageUrls.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10"
            aria-label="Close gallery"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative w-[min(96vw,72rem)] h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrls[currentImageIndex]}
              alt={`Property photo ${currentImageIndex + 1}`}
              className="w-full h-full object-contain rounded-lg"
              decoding="async"
            />

            {imageUrls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-0 sm:-left-14 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-0 sm:-right-14 top-1/2 -translate-y-1/2 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/80 text-sm">
                  {currentImageIndex + 1} / {imageUrls.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

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

        <ListingAgentCard agent={agent} />

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

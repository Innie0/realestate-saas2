'use client';

import Image from 'next/image';

export interface CmaListingImageProps {
  src: string;
  alt: string;
  imageSource?: 'listing' | 'map' | null;
  className?: string;
  sizes?: string;
}

/** Map thumbnails use Next/Image; MLS listing photos use a plain img (many CDN hosts). */
export default function CmaListingImage({
  src,
  alt,
  imageSource,
  className = 'object-cover',
  sizes = '120px',
}: CmaListingImageProps) {
  if (imageSource === 'listing' || !src.includes('api.mapbox.com')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={`h-full w-full ${className}`} loading="lazy" />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      unoptimized
    />
  );
}

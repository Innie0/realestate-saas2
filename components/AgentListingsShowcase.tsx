'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Bed, Bath, ArrowRight } from 'lucide-react';
import { formatListingPrice } from '@/lib/listing-utils';

export interface ShowcaseListing {
  id: string;
  title: string;
  address: string;
  price: number | null;
  thumb: string | null;
  beds: number | null;
  baths: number | null;
}

const ROTATE_MS = 4500;

function ListingCard({
  listing,
  featured = false,
  className = '',
}: {
  listing: ShowcaseListing;
  featured?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={`/listing/${listing.id}`}
      className={`group block rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-brand-300 hover:shadow-lg transition-all ${className}`}
    >
      <div className={`bg-gray-200 overflow-hidden ${featured ? 'aspect-[16/9]' : 'aspect-[16/10]'}`}>
        {listing.thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.thumb}
            alt={listing.address}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
            No photo
          </div>
        )}
      </div>
      <div className={featured ? 'p-5 sm:p-6' : 'p-4'}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`font-bold text-gray-900 ${featured ? 'text-xl sm:text-2xl' : 'text-base'}`}>
              {formatListingPrice(listing.price)}
            </p>
            <p className={`text-gray-600 mt-1 line-clamp-2 ${featured ? 'text-sm sm:text-base' : 'text-sm'}`}>
              {listing.address}
            </p>
            {(listing.beds != null || listing.baths != null) && (
              <p className="flex items-center gap-3 text-xs sm:text-sm text-gray-500 mt-2">
                {listing.beds != null && (
                  <span className="inline-flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5" />
                    {listing.beds} bed
                  </span>
                )}
                {listing.baths != null && (
                  <span className="inline-flex items-center gap-1">
                    <Bath className="w-3.5 h-3.5" />
                    {listing.baths} bath
                  </span>
                )}
              </p>
            )}
          </div>
          <span className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-brand-500/10 px-3 py-1.5 text-xs font-medium text-brand-700 group-hover:bg-brand-500 group-hover:text-white transition-colors">
            View
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function AgentListingsShowcase({ listings }: { listings: ShowcaseListing[] }) {
  const count = listings.length;
  const useCarousel = count > 2;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (next: number) => setIndex((next + count) % count),
    [count],
  );

  useEffect(() => {
    if (!useCarousel || paused) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [useCarousel, paused, count]);

  if (count === 0) return null;

  if (!useCarousel) {
    return (
      <div className={count === 1 ? 'max-w-xl mx-auto' : 'grid gap-4 sm:grid-cols-2'}>
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} featured={count === 1} />
        ))}
      </div>
    );
  }

  const current = listings[index];

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <p className="text-xs text-gray-500">
          {paused ? 'Paused — hover away to resume' : 'Auto-rotating listings'}
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-700 transition-colors"
            aria-label="Previous listing"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:text-brand-700 transition-colors"
            aria-label="Next listing"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl">
        {listings.map((listing, i) => (
          <div
            key={listing.id}
            className={`transition-all duration-500 ease-in-out ${
              i === index
                ? 'opacity-100 relative z-10'
                : 'opacity-0 absolute inset-0 z-0 pointer-events-none'
            }`}
            aria-hidden={i !== index}
          >
            <ListingCard listing={listing} featured />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 mt-4">
        {listings.map((listing, i) => (
          <button
            key={listing.id}
            type="button"
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? 'w-6 bg-brand-500' : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to listing ${i + 1}: ${listing.address}`}
          />
        ))}
      </div>

      {/* Thumbnail strip preview */}
      <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
        {listings.slice(0, 4).map((listing, i) => (
          <button
            key={listing.id}
            type="button"
            onClick={() => goTo(i)}
            className={`relative aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all ${
              i === index ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            {listing.thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.thumb} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
          </button>
        ))}
        {count > 4 && (
          <div className="aspect-[16/10] rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium">
            +{count - 4} more
          </div>
        )}
      </div>
    </div>
  );
}

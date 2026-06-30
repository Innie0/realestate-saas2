import Link from 'next/link';
import { ArrowRight, Bath, Bed, Square } from 'lucide-react';
import { formatListingPrice } from '@/lib/listing-utils';
import { buildListingDetailUrl, type MarketplaceListing } from '@/lib/marketplace-shared';

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  house: 'House',
  condo: 'Condo',
  apartment: 'Apartment',
  land: 'Land',
  commercial: 'Commercial',
};

interface MarketplaceListingCardProps {
  listing: MarketplaceListing;
  featured?: boolean;
  className?: string;
  returnTo?: string;
}

export default function MarketplaceListingCard({
  listing,
  featured = false,
  className = '',
  returnTo,
}: MarketplaceListingCardProps) {
  const typeLabel = listing.propertyType
    ? PROPERTY_TYPE_LABELS[listing.propertyType] ?? listing.propertyType
    : null;

  return (
    <Link
      href={buildListingDetailUrl(listing.id, returnTo)}
      className={`group block rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-brand-300 hover:shadow-lg transition-all ${className}`}
    >
      <div className={`relative bg-gray-200 overflow-hidden ${featured ? 'aspect-[16/9]' : 'aspect-[16/10]'}`}>
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
        {typeLabel && (
          <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm">
            {typeLabel}
          </span>
        )}
      </div>
      <div className={featured ? 'p-5 sm:p-6' : 'p-4'}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`font-bold text-gray-900 ${featured ? 'text-xl sm:text-2xl' : 'text-lg'}`}>
              {formatListingPrice(listing.price)}
            </p>
            <p className={`text-gray-600 mt-1 line-clamp-2 ${featured ? 'text-sm sm:text-base' : 'text-sm'}`}>
              {listing.address}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500 mt-2">
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
              {listing.squareFeet != null && (
                <span className="inline-flex items-center gap-1">
                  <Square className="w-3.5 h-3.5" />
                  {listing.squareFeet.toLocaleString()} sq ft
                </span>
              )}
            </div>
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

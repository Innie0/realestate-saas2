'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, SlidersHorizontal } from 'lucide-react';
import Select from '@/components/ui/Select';
import MarketplaceListingCard from '@/components/marketplace/MarketplaceListingCard';
import {
  buildMarketplaceSearchUrl,
  type MarketplaceFilters,
  type MarketplaceListing,
  type MarketplaceSort,
} from '@/lib/marketplace-shared';

interface MarketplaceResultsProps {
  listings: MarketplaceListing[];
  filters: MarketplaceFilters;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

export default function MarketplaceResults({
  listings,
  filters,
}: MarketplaceResultsProps) {
  const router = useRouter();
  const hasActiveFilters = Boolean(
    filters.location ||
      filters.type ||
      filters.minPrice != null ||
      filters.maxPrice != null ||
      filters.beds != null ||
      filters.baths != null
  );

  const handleSortChange = (sort: string) => {
    router.push(
      buildMarketplaceSearchUrl({
        ...filters,
        sort: sort as MarketplaceSort,
      })
    );
  };

  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 mb-4">
          <Home className="h-7 w-7 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">No properties found</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
          {hasActiveFilters
            ? 'Try widening your search — different location, price range, or property type.'
            : 'There are no published listings yet. Check back soon or list a property on Realestic.'}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          {hasActiveFilters && (
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clear search
            </Link>
          )}
          <Link
            href="/auth/signup"
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            List a property
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {listings.length} {listings.length === 1 ? 'property' : 'properties'} for sale
          </p>
          {hasActiveFilters && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtered results
            </p>
          )}
        </div>
        <div className="w-full sm:w-56">
          <Select
            label="Sort by"
            value={filters.sort ?? 'newest'}
            onChange={handleSortChange}
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {listings.map((listing) => (
          <MarketplaceListingCard
            key={listing.id}
            listing={listing}
            returnTo={buildMarketplaceSearchUrl(filters)}
          />
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import {
  MARKETPLACE_PROPERTY_TYPES,
  buildMarketplaceSearchUrl,
  type MarketplaceFilters,
} from '@/lib/marketplace-shared';

interface MarketplaceHeroSearchProps {
  initialFilters: MarketplaceFilters;
}

export default function MarketplaceHeroSearch({ initialFilters }: MarketplaceHeroSearchProps) {
  const router = useRouter();
  const [propertyType, setPropertyType] = useState(initialFilters.type ?? '');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const location = String(form.get('location') || '').trim() || undefined;
    const type = String(form.get('type') || '') || undefined;

    router.push(
      buildMarketplaceSearchUrl({
        location,
        type,
        minPrice: initialFilters.minPrice,
        maxPrice: initialFilters.maxPrice,
        beds: initialFilters.beds,
        baths: initialFilters.baths,
        sort: initialFilters.sort,
      })
    );
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row bg-white rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden border border-gray-200/80">
        <div className="relative sm:w-44 shrink-0 border-b sm:border-b-0 sm:border-r border-gray-200">
          <label htmlFor="hero-type" className="sr-only">
            Property type
          </label>
          <select
            id="hero-type"
            name="type"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full h-full min-h-[52px] px-4 py-3.5 text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500/30 appearance-none cursor-pointer"
          >
            {MARKETPLACE_PROPERTY_TYPES.map(({ value, label }) => (
              <option key={value || 'all'} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 flex min-w-0">
          <label htmlFor="hero-location" className="sr-only">
            Location
          </label>
          <input
            id="hero-location"
            name="location"
            type="text"
            defaultValue={initialFilters.location ?? ''}
            placeholder="Enter city, state, zip, or address"
            className="flex-1 min-w-0 px-4 sm:px-5 py-3.5 text-sm sm:text-base text-gray-900 placeholder-gray-400 focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 px-6 sm:px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white text-sm sm:text-base font-semibold transition-colors"
          >
            <span className="hidden sm:inline">Search</span>
            <Search className="w-5 h-5 sm:hidden" aria-hidden />
          </button>
        </div>
      </div>
    </form>
  );
}

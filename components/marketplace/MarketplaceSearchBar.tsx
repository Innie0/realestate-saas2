'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import Select from '@/components/ui/Select';
import {
  MARKETPLACE_PROPERTY_TYPES,
  buildMarketplaceSearchUrl,
  type MarketplaceFilters,
} from '@/lib/marketplace-shared';

interface MarketplaceSearchBarProps {
  initialFilters: MarketplaceFilters;
  compact?: boolean;
}

export default function MarketplaceSearchBar({
  initialFilters,
  compact = false,
}: MarketplaceSearchBarProps) {
  const router = useRouter();
  const [propertyType, setPropertyType] = useState(initialFilters.type ?? '');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const filters: MarketplaceFilters = {
      location: String(form.get('location') || '').trim() || undefined,
      type: String(form.get('type') || '') || undefined,
      minPrice: parseOptionalNumber(form.get('minPrice')),
      maxPrice: parseOptionalNumber(form.get('maxPrice')),
      beds: parseOptionalNumber(form.get('beds')),
      baths: parseOptionalNumber(form.get('baths')),
      sort: initialFilters.sort,
    };

    router.push(buildMarketplaceSearchUrl(filters));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.06)] ${
        compact ? 'p-4' : 'p-4 sm:p-5'
      }`}
    >
      <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2 lg:grid-cols-6' : 'sm:grid-cols-2 lg:grid-cols-6'}`}>
        <div className="lg:col-span-2">
          <label htmlFor="location" className="block text-xs font-medium text-gray-500 mb-1.5">
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            defaultValue={initialFilters.location ?? ''}
            placeholder="City, state, or zip"
            className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>

        <div>
          <Select
            label="Property type"
            name="type"
            value={propertyType}
            onChange={setPropertyType}
            options={MARKETPLACE_PROPERTY_TYPES.map(({ value, label }) => ({ value, label }))}
          />
        </div>

        <div>
          <label htmlFor="minPrice" className="block text-xs font-medium text-gray-500 mb-1.5">
            Min price
          </label>
          <input
            id="minPrice"
            name="minPrice"
            type="number"
            min={0}
            step={1000}
            defaultValue={initialFilters.minPrice ?? ''}
            placeholder="Any"
            className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>

        <div>
          <label htmlFor="maxPrice" className="block text-xs font-medium text-gray-500 mb-1.5">
            Max price
          </label>
          <input
            id="maxPrice"
            name="maxPrice"
            type="number"
            min={0}
            step={1000}
            defaultValue={initialFilters.maxPrice ?? ''}
            placeholder="Any"
            className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-1">
          <div>
            <label htmlFor="beds" className="block text-xs font-medium text-gray-500 mb-1.5">
              Beds
            </label>
            <input
              id="beds"
              name="beds"
              type="number"
              min={0}
              step={1}
              defaultValue={initialFilters.beds ?? ''}
              placeholder="Any"
              className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
          <div>
            <label htmlFor="baths" className="block text-xs font-medium text-gray-500 mb-1.5">
              Baths
            </label>
            <input
              id="baths"
              name="baths"
              type="number"
              min={0}
              step={0.5}
              defaultValue={initialFilters.baths ?? ''}
              placeholder="Any"
              className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-xs text-gray-500">More filters — price, beds, and baths.</p>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}

function parseOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  const raw = String(value ?? '').trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

import Link from 'next/link';
import MarketplaceResults from '@/components/marketplace/MarketplaceResults';
import { filterMarketplaceListings, type MarketplaceFilters } from '@/lib/marketplace-shared';
import { getPublishedMarketplaceListings } from '@/lib/marketplace-listings';

interface MarketplaceResultsSectionProps {
  filters: MarketplaceFilters;
}

export default async function MarketplaceResultsSection({
  filters,
}: MarketplaceResultsSectionProps) {
  const allListings = await getPublishedMarketplaceListings();
  const listings = filterMarketplaceListings(allListings, filters);

  return (
    <>
      <MarketplaceResults listings={listings} filters={filters} />

      {listings.length > 0 && (
        <div className="mt-10 rounded-2xl border border-brand-100 bg-brand-50/60 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Are you a real estate agent?</p>
            <p className="text-sm text-gray-600 mt-1">
              Publish listings, capture leads, and run your business with Realestic AI tools.
            </p>
          </div>
          <Link
            href="/for-agents"
            className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors shrink-0"
          >
            Explore agent tools
          </Link>
        </div>
      )}
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import MarketplaceNav from '@/components/marketplace/MarketplaceNav';
import MarketplaceSearchBar from '@/components/marketplace/MarketplaceSearchBar';
import MarketplaceResults from '@/components/marketplace/MarketplaceResults';
import MarketplaceFooter from '@/components/marketplace/MarketplaceFooter';
import {
  filterMarketplaceListings,
  getPublishedMarketplaceListings,
  parseMarketplaceSearchParams,
} from '@/lib/marketplace-listings';
import { SITE_NAME_ALT, SITE_URL } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `Properties for Sale | ${SITE_NAME_ALT}`,
  description:
    'Browse homes and properties for sale on Realestic. Search by location, property type, and price — no account required.',
  keywords: [
    'properties for sale',
    'homes for sale',
    'Realestic',
    'Realestic AI',
    'real estate listings',
    'houses for sale',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME_ALT,
    title: `Properties for Sale | ${SITE_NAME_ALT}`,
    description:
      'Search properties for sale by location, type, and price. Browse listings on Realestic — no sign-up required.',
    images: [
      {
        url: '/logo-wordmark.png',
        width: 800,
        height: 240,
        alt: `${SITE_NAME_ALT} — Properties for Sale`,
      },
    ],
  },
};

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function MarketplaceHomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const filters = parseMarketplaceSearchParams(params);
  const allListings = await getPublishedMarketplaceListings();
  const listings = filterMarketplaceListings(allListings, filters);

  return (
    <div className="min-h-screen bg-[#F3F3F2] flex flex-col">
      <MarketplaceNav />

      <main className="flex-1">
        <section className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="max-w-3xl mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
                Properties for sale
              </h1>
              <p className="mt-3 text-gray-500 text-sm sm:text-base">
                Search by area and property type. View listings for free — contact the listing agent
                directly from each property page.
              </p>
            </div>
            <MarketplaceSearchBar initialFilters={filters} />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
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
        </section>
      </main>

      <MarketplaceFooter />
    </div>
  );
}

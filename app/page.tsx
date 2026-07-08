import type { Metadata } from 'next';
import { Suspense } from 'react';
import MarketplaceNav from '@/components/marketplace/MarketplaceNav';
import MarketplaceHero from '@/components/marketplace/MarketplaceHero';
import MarketplaceSearchBar from '@/components/marketplace/MarketplaceSearchBar';
import MarketplaceResultsSection from '@/components/marketplace/MarketplaceResultsSection';
import MarketplaceResultsSkeleton from '@/components/marketplace/MarketplaceResultsSkeleton';
import MarketplaceExploreSection from '@/components/marketplace/MarketplaceExploreSection';
import MarketplaceFooter from '@/components/marketplace/MarketplaceFooter';
import {
  hasMarketplaceSearchQuery,
  parseMarketplaceSearchParams,
} from '@/lib/marketplace-shared';
import { SITE_NAME_ALT, SITE_URL } from '@/lib/site-config';

export const metadata: Metadata = {
  title: `Properties for Sale | ${SITE_NAME_ALT}`,
  description:
    'Search homes and properties for sale on Realestic. Find listings by location and property type — no account required.',
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
      'Search properties for sale by location and type. Find properties for sale on Realestic.',
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
  const showResults = hasMarketplaceSearchQuery(params);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketplaceNav />

      <main className="flex-1">
        <MarketplaceHero initialFilters={filters} compact={showResults} />

        {showResults ? (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 bg-[#F4F4F5]">
            <div className="mb-8">
              <MarketplaceSearchBar initialFilters={filters} />
            </div>

            <Suspense fallback={<MarketplaceResultsSkeleton />}>
              <MarketplaceResultsSection filters={filters} />
            </Suspense>
          </section>
        ) : (
          <MarketplaceExploreSection />
        )}
      </main>

      <MarketplaceFooter />
    </div>
  );
}

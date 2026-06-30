import type { Metadata } from 'next';
import Link from 'next/link';
import PublicListingView from '@/components/PublicListingView';
import LeadCaptureForm from '@/components/LeadCaptureForm';
import ListingPageHeader from '@/components/listing/ListingPageHeader';
import {
  getPublicListing,
  parseListingReturnTo,
} from '@/lib/public-listing';
import {
  formatListingAddress,
  formatListingPrice,
  getListingDescription,
  normalizeProjectImages,
} from '@/lib/listing-utils';
import { SITE_NAME_ALT, SITE_URL } from '@/lib/site-config';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await getPublicListing(id);

  if (!listing) {
    return {
      title: 'Listing not found',
      robots: { index: false, follow: false },
    };
  }

  const { project } = listing;
  const info = project.property_info || {};
  const address = formatListingAddress(info, project.title);
  const price = formatListingPrice(info.price);
  const description =
    getListingDescription(project).slice(0, 160) ||
    `${address} — listed for ${price} on ${SITE_NAME_ALT}.`;
  const thumb = normalizeProjectImages(project.images)[0];
  const pageUrl = `${SITE_URL}/listing/${id}`;
  const title = `${address} | ${price}`;

  return {
    title,
    description,
    alternates: { canonical: `/listing/${id}` },
    openGraph: {
      type: 'website',
      url: pageUrl,
      title,
      description,
      siteName: SITE_NAME_ALT,
      ...(thumb
        ? {
            images: [{ url: thumb, alt: address }],
          }
        : {}),
    },
    twitter: {
      card: thumb ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(thumb ? { images: [thumb] } : {}),
    },
  };
}

export default async function PublicListingPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const returnTo = parseListingReturnTo(query.returnTo);
  const listing = await getPublicListing(id);

  if (!listing) {
    return (
      <div className="min-h-screen bg-[#F5F5F5]">
        <ListingPageHeader returnTo="/" />
        <div className="flex items-center justify-center p-6 min-h-[50vh]">
          <div className="text-center max-w-md">
            <p className="text-gray-600 text-lg font-medium">This listing isn&apos;t available.</p>
            <p className="text-gray-500 text-sm mt-2">
              It may have been unpublished or the link is incorrect.
            </p>
            <Link
              href="/"
              className="inline-flex mt-6 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Browse properties
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { project, agent } = listing;
  const listingAddress = formatListingAddress(project.property_info, project.title);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <ListingPageHeader returnTo={returnTo} />

      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-8">
        <PublicListingView project={project} agent={agent} />

        <div className="rounded-xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Interested in this home?</h2>
          <p className="text-sm text-gray-500 mb-6">
            Send a message to {agent.name.split(' ')[0]} and they&apos;ll get back to you soon.
          </p>
          <LeadCaptureForm
            agentId={agent.id}
            agentName={agent.name}
            variant="listing"
            source="listing_page"
            listingAddress={listingAddress}
          />
        </div>
      </div>

      <div className="border-t border-gray-200 py-6 text-center">
        <p className="text-xs text-gray-500">Powered by Realestic</p>
      </div>
    </div>
  );
}

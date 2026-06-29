'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { buildMarketplaceSearchUrl } from '@/lib/marketplace-shared';

type ExploreTab = 'find' | 'research' | 'list';

const CATEGORY_CARDS = [
  {
    title: 'Homes for Sale',
    description:
      'Browse houses, condos, and apartments. Save your search, view photos, and contact the listing agent directly.',
    image: '/marketplace/card-homes.jpg',
    type: undefined,
  },
  {
    title: 'Land & Lots',
    description:
      'Find vacant land and development opportunities. Filter by location and explore listings on Realestic.',
    image: '/marketplace/card-land.jpg',
    type: 'land' as const,
  },
  {
    title: 'Commercial',
    description:
      'View commercial properties for sale. Connect with agents and request more information from each listing page.',
    image: '/marketplace/card-commercial.jpg',
    type: 'commercial' as const,
  },
];

export default function MarketplaceExploreSection() {
  const [tab, setTab] = useState<ExploreTab>('find');

  return (
    <section className="bg-white border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 tracking-tight mb-8">
          Explore, research, and compare properties right here
        </h2>

        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1">
            {(
              [
                { id: 'find' as const, label: 'Find' },
                { id: 'research' as const, label: 'Research' },
                { id: 'list' as const, label: 'List' },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`px-6 sm:px-8 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  tab === id
                    ? 'bg-white text-brand-600 shadow-sm border border-brand-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'find' && (
          <div className="grid gap-6 md:grid-cols-3">
            {CATEGORY_CARDS.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[16/10] bg-gray-100">
                  <Image
                    src={card.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900">{card.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{card.description}</p>
                  <Link
                    href={buildMarketplaceSearchUrl(
                      card.type ? { type: card.type } : {}
                    )}
                    className="mt-5 inline-flex items-center justify-center w-full rounded-lg border-2 border-brand-500 px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    View listings
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {tab === 'research' && (
          <div className="max-w-2xl mx-auto text-center rounded-2xl border border-gray-200 bg-gray-50 px-6 py-12">
            <h3 className="text-xl font-bold text-gray-900">Property research for agents</h3>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              Run CMAs, pull property records, and analyze comps with Realestic&apos;s agent tools.
              Buyer research on the marketplace is free — no sign-up required to browse listings.
            </p>
            <Link
              href="/for-agents"
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Explore agent tools
            </Link>
          </div>
        )}

        {tab === 'list' && (
          <div className="max-w-2xl mx-auto text-center rounded-2xl border border-gray-200 bg-gray-50 px-6 py-12">
            <h3 className="text-xl font-bold text-gray-900">List your property on Realestic</h3>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              Agents can publish listings to the marketplace from their dashboard. Reach buyers
              searching by area and property type — with lead capture built in.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors w-full sm:w-auto"
              >
                Get started
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto"
              >
                Contact us
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

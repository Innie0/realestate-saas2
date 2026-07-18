import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import AgentDirectorySearch from '@/components/agents/AgentDirectorySearch';
import { getPublicAgentDirectory, groupAgentsByArea } from '@/lib/agent-directory';
import { SITE_NAME_ALT, SITE_URL } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Find a Real Estate Agent Near You',
  description:
    'Browse local real estate agents by area and connect directly — no lead-selling middleman, just agents who actively manage their own listings and clients.',
  alternates: { canonical: '/agents' },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/agents`,
    siteName: SITE_NAME_ALT,
    title: 'Find a Real Estate Agent Near You',
    description: 'Browse local real estate agents by area and connect directly.',
  },
  twitter: {
    card: 'summary',
    title: 'Find a Real Estate Agent Near You',
    description: 'Browse local real estate agents by area and connect directly.',
  },
};

// This queries live agent data, so render per-request rather than freezing
// the directory at build time (matches how /agent/[slug] works).
export const dynamic = 'force-dynamic';

export default async function AgentDirectoryPage() {
  const agents = await getPublicAgentDirectory();
  const groups = groupAgentsByArea(agents);

  return (
    <div className="min-h-screen bg-[#F4F4F5]">
      <header className="sticky top-0 z-10 bg-[#F5F5F5]/90 backdrop-blur-md border-b border-gray-200/70">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Oikaro" className="h-8 w-auto" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 lg:px-8 lg:py-14">
        <div className="mb-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 mb-4">
            <Users className="w-3.5 h-3.5" />
            Agent Directory
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900">
            Find a real estate agent near you
          </h1>
          <p className="text-gray-700 mt-3 leading-relaxed">
            Browse agents by the areas they serve and reach out directly — every profile below is
            actively managed by the agent themselves.
          </p>
        </div>

        {agents.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-100 mb-4">
              <Users className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No public agent profiles yet</h3>
            <p className="text-sm text-gray-700 max-w-sm mx-auto">
              Agents who enable their public profile will be listed here, organized by the areas they
              serve.
            </p>
          </div>
        ) : (
          <AgentDirectorySearch groups={groups} linkToAreaPages />
        )}
      </main>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, MapPin } from 'lucide-react';
import AgentDirectorySearch from '@/components/agents/AgentDirectorySearch';
import { getAreaGroup } from '@/lib/agent-directory';
import { SITE_NAME_ALT, SITE_URL } from '@/lib/site-config';

interface PageProps {
  params: Promise<{ area: string }>;
}

// Queries live agent data per request — same reasoning as /agents.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { area: areaSlug } = await params;
  const group = await getAreaGroup(areaSlug);

  if (!group) {
    return {
      title: 'Area not found',
      robots: { index: false, follow: false },
    };
  }

  const title = `Real Estate Agents in ${group.area}`;
  const description = `Browse ${group.agents.length} real estate agent${
    group.agents.length === 1 ? '' : 's'
  } serving ${group.area} and connect directly on ${SITE_NAME_ALT}.`;
  const pageUrl = `${SITE_URL}/agents/${areaSlug}`;

  return {
    title,
    description,
    alternates: { canonical: `/agents/${areaSlug}` },
    openGraph: {
      type: 'website',
      url: pageUrl,
      siteName: SITE_NAME_ALT,
      title,
      description,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function AgentAreaPage({ params }: PageProps) {
  const { area: areaSlug } = await params;
  const group = await getAreaGroup(areaSlug);

  if (!group) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
        <div className="text-center max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-gray-900 text-lg font-semibold">Area not found</p>
          <p className="text-gray-500 text-sm mt-2">
            We don&apos;t have any agents listed for that area yet.
          </p>
          <Link
            href="/agents"
            className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Browse all agents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F3F2]">
      <header className="sticky top-0 z-10 bg-[#F5F5F5]/90 backdrop-blur-md border-b border-gray-200/70">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link
              href="/agents"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              All Agents
            </Link>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Realestic" className="h-8 w-auto" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 lg:px-8 lg:py-14">
        <div className="mb-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 mb-4">
            <MapPin className="w-3.5 h-3.5" />
            {group.area}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900">
            Real estate agents in {group.area}
          </h1>
          <p className="text-gray-500 mt-3 leading-relaxed">
            {group.agents.length} agent{group.agents.length === 1 ? '' : 's'} serving {group.area} —
            reach out directly, no lead-selling middleman.
          </p>
        </div>

        <AgentDirectorySearch groups={[group]} />
      </main>
    </div>
  );
}

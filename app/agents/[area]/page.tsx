import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import MarketingSubpageHeader from '@/components/marketing/MarketingSubpageHeader';
import MarketingSubpageFooter from '@/components/marketing/MarketingSubpageFooter';
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
      <div className="marketing-root min-h-screen bg-white flex items-center justify-center p-6 text-mkt-foreground">
        <div className="text-center max-w-md rounded-mkt-card border border-mkt-border bg-mkt-surface p-8 shadow-sm">
          <p className="text-mkt-foreground text-lg font-medium">Area not found</p>
          <p className="text-mkt-secondary text-sm mt-2">
            We don&apos;t have any agents listed for that area yet.
          </p>
          <Link
            href="/agents"
            className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-[#0668E1] hover:text-[#0450b0]"
          >
            Browse all agents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="marketing-root min-h-screen bg-white text-mkt-foreground">
      <MarketingSubpageHeader />

      <main className="mx-auto max-w-5xl px-6 py-10 lg:px-8 lg:py-14">
        <div className="mb-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-mkt-border bg-mkt-surface px-3 py-1 text-xs font-medium text-mkt-secondary mb-4">
            <MapPin className="w-3.5 h-3.5" />
            {group.area}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-medium tracking-[-0.02em] text-mkt-foreground">
            Real estate agents in {group.area}
          </h1>
          <p className="text-mkt-secondary mt-3 leading-relaxed">
            {group.agents.length} agent{group.agents.length === 1 ? '' : 's'} serving {group.area} —
            reach out directly, no lead-selling middleman.
          </p>
        </div>

        <AgentDirectorySearch groups={[group]} />
      </main>

      <MarketingSubpageFooter />
    </div>
  );
}

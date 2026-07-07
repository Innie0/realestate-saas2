import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Award, Building2, MapPin, Search, Users } from 'lucide-react';
import { getPublicAgentDirectory, groupAgentsByArea, type PublicAgentSummary } from '@/lib/agent-directory';
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
// the directory at build time (matches how /agent/[slug] and /listing/[id]
// already work).
export const dynamic = 'force-dynamic';

function areaAnchor(area: string): string {
  return area
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function AgentCard({ agent }: { agent: PublicAgentSummary }) {
  const initials = agent.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <Link
      href={agent.path}
      className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-brand-300 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        {agent.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={agent.photoUrl}
            alt={agent.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">{initials || 'A'}</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate group-hover:text-brand-700 transition-colors">
            {agent.name}
          </p>
          {agent.brokerage && (
            <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3" />
              {agent.brokerage}
            </p>
          )}
        </div>
      </div>

      {agent.headline && (
        <p className="text-sm text-gray-600 mt-3 line-clamp-2 leading-relaxed">{agent.headline}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {agent.yearsExperience != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
            <Award className="w-3 h-3" />
            {agent.yearsExperience}+ yrs
          </span>
        )}
        {agent.specialties.slice(0, 2).map((specialty) => (
          <span
            key={specialty}
            className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700"
          >
            {specialty}
          </span>
        ))}
      </div>
    </Link>
  );
}

export default async function AgentDirectoryPage() {
  const agents = await getPublicAgentDirectory();
  const groups = groupAgentsByArea(agents);

  return (
    <div className="min-h-screen bg-[#F3F3F2]">
      <header className="sticky top-0 z-10 bg-[#F5F5F5]/90 backdrop-blur-md border-b border-gray-200/70">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Realestic" className="h-8 w-auto" />
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
          <p className="text-gray-500 mt-3 leading-relaxed">
            Browse agents by the areas they serve and reach out directly — every profile below is
            actively managed by the agent themselves.
          </p>
        </div>

        {agents.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-100 mb-4">
              <Search className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No public agent profiles yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Agents who enable their public profile will be listed here, organized by the areas they
              serve.
            </p>
          </div>
        ) : (
          <>
            {groups.length > 1 && (
              <nav className="mb-10 flex flex-wrap gap-2" aria-label="Jump to area">
                {groups.map(({ area }) => (
                  <a
                    key={area}
                    href={`#${areaAnchor(area)}`}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-brand-300 hover:text-brand-700 transition-colors"
                  >
                    {area}
                  </a>
                ))}
              </nav>
            )}

            <div className="space-y-12">
              {groups.map((group) => (
                <section key={group.area} id={areaAnchor(group.area)}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-brand-500" />
                    {group.area}
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.agents.map((agent) => (
                      <AgentCard key={`${group.area}-${agent.id}`} agent={agent} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin, Search, X } from 'lucide-react';
import AgentCard from './AgentCard';
import { slugifyArea, type AreaGroup } from '@/lib/agent-directory';

interface AgentDirectorySearchProps {
  groups: AreaGroup[];
  /** Show a "View all agents in {area} →" link on each section (used on the
   * combined /agents page; omitted on a single-area page since you're
   * already there). */
  linkToAreaPages?: boolean;
}

function matchesQuery(agent: AreaGroup['agents'][number], query: string): boolean {
  const haystack = [
    agent.name,
    agent.headline,
    agent.bio,
    agent.brokerage,
    ...agent.specialties,
    ...agent.areas,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

export default function AgentDirectorySearch({ groups, linkToAreaPages = false }: AgentDirectorySearchProps) {
  const [query, setQuery] = useState('');

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((group) => ({
        area: group.area,
        agents: group.agents.filter((agent) => matchesQuery(agent, q)),
      }))
      .filter((group) => group.agents.length > 0);
  }, [groups, query]);

  return (
    <div>
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, area, or specialty"
          className="w-full rounded-mkt-button border border-mkt-border bg-mkt-surface pl-10 pr-9 py-2.5 text-sm text-mkt-foreground placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0668E1]/20 focus:border-[#0668E1]/30"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {filteredGroups.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gray-100 mb-4">
            <Search className="w-6 h-6 text-gray-400" strokeWidth={1.5} />
          </div>
          <h3 className="text-base font-medium text-mkt-foreground mb-1">No agents match &ldquo;{query}&rdquo;</h3>
          <p className="text-sm text-mkt-secondary max-w-sm mx-auto">Try a different name, area, or specialty.</p>
        </div>
      ) : (
        <>
          {!query && groups.length > 1 && (
            <nav className="mb-10 flex flex-wrap gap-2" aria-label="Jump to area">
              {groups.map(({ area }) => (
                <a
                  key={area}
                  href={`#${slugifyArea(area)}`}
                  className="rounded-full border border-mkt-border bg-mkt-surface px-3 py-1.5 text-xs font-medium text-mkt-secondary hover:border-[#0668E1]/40 hover:text-[#0668E1] transition-colors"
                >
                  {area}
                </a>
              ))}
            </nav>
          )}

          <div className="space-y-12">
            {filteredGroups.map((group) => (
              <section key={group.area} id={slugifyArea(group.area)}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <h2 className="font-display text-lg font-medium text-mkt-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#0668E1]" />
                    {group.area}
                  </h2>
                  {linkToAreaPages && (
                    <Link
                      href={`/agents/${slugifyArea(group.area)}`}
                      className="text-xs font-medium text-[#0668E1] hover:text-[#0450b0] transition-colors whitespace-nowrap"
                    >
                      View all in {group.area} →
                    </Link>
                  )}
                </div>
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
    </div>
  );
}

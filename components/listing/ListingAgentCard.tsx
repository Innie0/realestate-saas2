import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { PublicListingAgent } from '@/lib/public-listing-shared';

interface ListingAgentCardProps {
  agent: PublicListingAgent;
}

export default function ListingAgentCard({ agent }: ListingAgentCardProps) {
  const initials = agent.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
      <div className="flex items-center gap-3 min-w-0">
        {agent.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={agent.photoUrl}
            alt={agent.name}
            className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-gray-700">{initials}</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Listed by</p>
          <p className="text-base font-semibold text-gray-900 truncate">{agent.name}</p>
          {agent.headline && (
            <p className="text-sm text-gray-500 truncate">{agent.headline}</p>
          )}
        </div>
        <Link
          href={agent.profilePath}
          className="inline-flex items-center gap-0.5 shrink-0 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          View profile
          <ChevronRight className="w-4 h-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

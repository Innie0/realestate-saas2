import Link from 'next/link';
import { Award, Building2 } from 'lucide-react';
import type { PublicAgentSummary } from '@/lib/agent-directory';

export default function AgentCard({ agent }: { agent: PublicAgentSummary }) {
  const initials = agent.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <Link
      href={agent.path}
      className="group flex flex-col rounded-2xl border border-gray-200 bg-[var(--surface)] p-5 shadow-sm hover:border-brand-300 hover:shadow-md transition-all"
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
            <p className="text-xs text-gray-700 truncate flex items-center gap-1 mt-0.5">
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

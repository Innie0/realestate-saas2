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
      className="group flex flex-col rounded-mkt-card border border-mkt-border bg-mkt-surface p-5 shadow-[var(--mkt-shadow-soft)] hover:border-[#0668E1]/40 hover:shadow-md transition-all"
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
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0668E1] to-[#0450b0] flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">{initials || 'A'}</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium text-mkt-foreground truncate group-hover:text-[#0668E1] transition-colors">
            {agent.name}
          </p>
          {agent.brokerage && (
            <p className="text-xs text-mkt-secondary truncate flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3" />
              {agent.brokerage}
            </p>
          )}
        </div>
      </div>

      {agent.headline && (
        <p className="text-sm text-mkt-secondary mt-3 line-clamp-2 leading-relaxed">{agent.headline}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {agent.yearsExperience != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-mkt-surface-muted px-2.5 py-1 text-[11px] font-medium text-mkt-secondary">
            <Award className="w-3 h-3" />
            {agent.yearsExperience}+ yrs
          </span>
        )}
        {agent.specialties.slice(0, 2).map((specialty) => (
          <span
            key={specialty}
            className="inline-flex items-center rounded-full bg-[#0668E1]/10 px-2.5 py-1 text-[11px] font-medium text-[#0668E1]"
          >
            {specialty}
          </span>
        ))}
      </div>
    </Link>
  );
}

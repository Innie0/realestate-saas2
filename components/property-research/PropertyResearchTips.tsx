'use client';

import { BarChart2, RefreshCw, UserSearch } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const TIPS = [
  {
    icon: UserSearch,
    title: 'Verified owner contact',
    description:
      'Pull county-record owner names plus phone and email matches so you can reach out with confidence before a listing appointment.',
  },
  {
    icon: BarChart2,
    title: 'Comp-based CMA',
    description:
      'Run a market analysis from the same search to anchor price conversations with recent sales near the subject property.',
  },
  {
    icon: RefreshCw,
    title: 'Reload without a new lookup',
    description:
      'Recent searches reload cached results locally. Demo and cached reloads do not count toward your monthly lookup limit.',
  },
] as const;

export default function PropertyResearchTips() {
  return (
    <Card className="p-5 sm:p-[22px]">
      <h3 className="text-[14px] font-semibold text-foreground">Why property research helps</h3>
      <p className="mt-1 text-[13px] text-muted-foreground">
        One search covers owner intel, property facts, and pricing context for listing prep and buyer consultations.
      </p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {TIPS.map((tip) => {
          const Icon = tip.icon;
          return (
            <li
              key={tip.title}
              className="rounded-lg border border-border bg-[var(--canvas)] px-3.5 py-3"
            >
              <div className="mb-2 flex size-8 items-center justify-center rounded-md bg-muted/60">
                <Icon className="size-4 text-muted-foreground" strokeWidth={1.8} />
              </div>
              <p className="text-[13px] font-medium text-foreground">{tip.title}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{tip.description}</p>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

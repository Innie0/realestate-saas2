'use client';

import Link from 'next/link';
import { ChevronDown, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { useApi } from '@/lib/swr';

function getTrialDaysRemaining(status: string | null | undefined, periodEnd: string | null | undefined) {
  if (status !== 'trialing' || !periodEnd) return null;
  const end = new Date(periodEnd);
  const diff = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

interface UsageStatusPillProps {
  className?: string;
}

/** Top-bar pill — trial days remaining or plan label (Instantly credit-counter style). */
export default function UsageStatusPill({ className }: UsageStatusPillProps) {
  const { response } = useApi('/api/usage');

  const plan = (response?.plan as string) ?? 'starter';
  const status = response?.subscription_status as string | null | undefined;
  const periodEnd = response?.subscription_current_period_end as string | null | undefined;
  const trialDays = getTrialDaysRemaining(status, periodEnd);

  let label: string;
  if (trialDays !== null) {
    label = trialDays === 1 ? '1 day left in trial' : `${trialDays} days left in trial`;
  } else if (status === 'active') {
    label = plan === 'pro' ? 'Pro plan' : 'Starter plan';
  } else {
    label = 'View plans';
  }

  return (
    <Link
      href="/dashboard/account"
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1',
        'text-[12px] font-medium text-foreground transition-colors hover:bg-muted/50',
        className,
      )}
    >
      <Sparkles className="size-3.5 text-brand-500" strokeWidth={1.75} />
      <span className="tabular-nums">{label}</span>
      <ChevronDown className="size-3 text-muted-foreground" strokeWidth={2} />
    </Link>
  );
}

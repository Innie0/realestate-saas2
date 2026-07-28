import Link from 'next/link';
import clsx from 'clsx';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/skeleton';

interface UsageItem {
  current: number;
  limit: number;
}

interface PlanUsagePanelProps {
  usage: Record<string, UsageItem>;
  plan: 'starter' | 'pro';
  className?: string;
  layout?: 'full' | 'sidebar';
}

const USAGE_ROWS = [
  { key: 'projects', label: 'Projects', period: '/mo' },
  { key: 'property_lookups', label: 'Lookups', period: '/mo' },
  { key: 'market_analyses', label: 'CMA', period: '/mo' },
  { key: 'ai_messages', label: 'AI messages', period: '/mo' },
  { key: 'clients', label: 'Clients', period: 'total' },
  { key: 'transactions', label: 'Transactions', period: '/mo' },
  { key: 'calendar_events', label: 'Events', period: '' },
] as const;

const usageGridClass = (layout: 'full' | 'sidebar') =>
  layout === 'sidebar'
    ? 'grid grid-cols-1 gap-3'
    : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4';

export function PlanUsagePanelSkeleton({ layout = 'full', className }: { layout?: 'full' | 'sidebar'; className?: string }) {
  return (
    <div data-tour="plan-usage" className={clsx('self-start w-full', className)} aria-hidden>
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
        <div className={usageGridClass(layout)}>
          {USAGE_ROWS.map(({ key }) => (
            <div key={key} className="min-w-0">
              <div className="mb-1 flex items-baseline justify-between gap-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function PlanUsagePanel({ usage, plan, className, layout = 'full' }: PlanUsagePanelProps) {
  const rows = USAGE_ROWS.map((row) =>
    row.key === 'property_lookups' && plan === 'pro'
      ? { ...row, period: '' }
      : row,
  );

  return (
    <div data-tour="plan-usage" className={clsx('self-start w-full', className)}>
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-label">
            Plan usage · <span className="capitalize text-muted-foreground">{plan}</span>
          </p>
          {plan !== 'pro' && (
            <Link href="/dashboard/upgrade">
              <Button variant="outline" size="sm">
                Upgrade
              </Button>
            </Link>
          )}
        </div>

        <div className={usageGridClass(layout)}>
          {rows.map(({ key, label, period }) => {
            const item = usage[key];
            if (!item) return null;
            const isUnlimited = item.limit === -1;
            const pct = isUnlimited ? 0 : Math.min((item.current / item.limit) * 100, 100);
            const isAtLimit = !isUnlimited && pct >= 100;
            const isNearLimit = !isUnlimited && pct >= 80;

            return (
              <div key={key} className={layout === 'sidebar' ? 'min-w-0 flex items-center gap-3' : 'min-w-0'}>
                <div className={layout === 'sidebar' ? 'flex-1 min-w-0' : ''}>
                  <div className="flex items-baseline justify-between gap-1 mb-1">
                    <span className="text-caption text-muted-foreground truncate">{label}</span>
                    <span
                      className={`text-caption tabular-nums shrink-0 ${
                        isAtLimit
                          ? 'text-red-600 font-medium'
                          : isNearLimit
                            ? 'text-amber-600 font-medium'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {isUnlimited ? '∞' : `${item.current}/${item.limit}`}
                      {period && !isUnlimited && (
                        <span className="text-muted-foreground/70 font-normal"> {period}</span>
                      )}
                    </span>
                  </div>
                  {!isUnlimited && (
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-brand-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

import Link from 'next/link';
import clsx from 'clsx';
import Surface from '@/components/ui/Surface';
import Button from '@/components/ui/Button';

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
      <Surface flat padding="md">
        <div className="flex items-center justify-between gap-3 mb-5 animate-pulse">
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded w-16" />
            <div className="h-5 bg-gray-100 rounded w-20" />
          </div>
          <div className="h-8 w-20 bg-gray-100 rounded-lg" />
        </div>
        <div className={usageGridClass(layout)}>
          {USAGE_ROWS.map(({ key }) => (
            <div key={key} className="min-w-0 animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-16 mb-2" />
              <div className="h-5 bg-gray-100 rounded w-12 mb-2" />
              <div className="h-1.5 bg-gray-100 rounded-full" />
            </div>
          ))}
        </div>
      </Surface>
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
      <Surface flat padding="md">
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-label">
            Plan usage · <span className="capitalize text-gray-600">{plan}</span>
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
                    <span className="text-caption text-gray-700 truncate">{label}</span>
                    <span
                      className={`text-caption tabular-nums shrink-0 ${
                        isAtLimit
                          ? 'text-red-600 font-medium'
                          : isNearLimit
                            ? 'text-amber-600 font-medium'
                            : 'text-gray-600'
                      }`}
                    >
                      {isUnlimited ? '∞' : `${item.current}/${item.limit}`}
                      {period && !isUnlimited && (
                        <span className="text-gray-400 font-normal"> {period}</span>
                      )}
                    </span>
                  </div>
                  {!isUnlimited && (
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-gray-300'
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
      </Surface>
    </div>
  );
}

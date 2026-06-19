import Link from 'next/link';
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

export default function PlanUsagePanel({ usage, plan, className }: PlanUsagePanelProps) {
  const rows = USAGE_ROWS.map((row) =>
    row.key === 'property_lookups' && plan === 'pro'
      ? { ...row, period: '' }
      : row,
  );

  return (
    <div data-tour="plan-usage" className={className}>
      <Surface padding="md">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-label mb-1">Your plan</p>
          <p className="text-title font-semibold capitalize">{plan}</p>
        </div>
        {plan !== 'pro' && (
          <Link href="/dashboard/upgrade">
            <Button variant="outline" size="sm">
              Upgrade
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {rows.map(({ key, label, period }) => {
          const item = usage[key];
          if (!item) return null;
          const isUnlimited = item.limit === -1;
          const pct = isUnlimited ? 0 : Math.min((item.current / item.limit) * 100, 100);
          const isAtLimit = !isUnlimited && pct >= 100;
          const isNearLimit = !isUnlimited && pct >= 80;

          return (
            <div key={key} className="min-w-0">
              <div className="flex items-baseline justify-between gap-1 mb-1.5">
                <span className="text-caption text-gray-600 truncate">{label}</span>
                {period && <span className="text-[0.625rem] text-gray-400 shrink-0">{period}</span>}
              </div>
              <p
                className={`text-body font-semibold tabular-nums ${
                  isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-gray-900'
                }`}
              >
                {isUnlimited ? (
                  <span className="text-gray-500 font-normal">∞</span>
                ) : (
                  <>
                    {item.current}
                    <span className="text-caption text-gray-400 font-normal">/{item.limit}</span>
                  </>
                )}
              </p>
              {!isUnlimited && (
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-brand-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Surface>
    </div>
  );
}

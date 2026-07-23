import clsx from 'clsx';
import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonStatBlock({
  showBadge = false,
  className,
}: {
  showBadge?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx('px-4 py-4 sm:px-5', className)}>
      <Skeleton className="h-3 w-20" />
      <div className="mt-2 flex items-end justify-between gap-2">
        <Skeleton className="h-7 w-16" />
        {showBadge ? <Skeleton className="h-[26px] w-[72px] shrink-0 rounded-sm" /> : null}
      </div>
      <Skeleton className="mt-2 h-3 w-24" />
    </div>
  );
}

export function SkeletonMetricStrip({
  count = 4,
  badgeIndex = 2,
}: {
  count?: number;
  badgeIndex?: number;
}) {
  return (
    <div className="grid grid-cols-2 divide-y divide-border lg:grid-cols-4 lg:divide-x lg:divide-y-0">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonStatBlock key={index} showBadge={index === badgeIndex} />
      ))}
    </div>
  );
}

/** Inline label + value pair used in deal cards and detail stat grids. */
export function SkeletonStatPair({
  labelWidth = 'w-12',
  valueWidth = 'w-20',
}: {
  labelWidth?: string;
  valueWidth?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Skeleton className={clsx('h-3', labelWidth)} />
      <Skeleton className={clsx('h-4', valueWidth)} />
    </div>
  );
}

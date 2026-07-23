import clsx from 'clsx';
import type { ReactNode } from 'react';
import PageToolbar from '@/components/layout/PageToolbar';
import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonToolbar({
  searchWidth = 'w-full',
  filters,
  trailing,
  children,
}: {
  searchWidth?: string;
  filters?: Array<string | number>;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  if (children) {
    return <PageToolbar>{children}</PageToolbar>;
  }

  return (
    <PageToolbar>
      <div className="flex w-full flex-1 flex-col gap-3 lg:flex-row lg:items-center">
        <Skeleton className={clsx('h-10 rounded-lg', searchWidth)} />
        {filters?.length ? (
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            {filters.map((width, index) => (
              <Skeleton
                key={index}
                className="h-9 rounded-lg"
                style={{ width: typeof width === 'number' ? width : undefined }}
              />
            ))}
            {trailing}
          </div>
        ) : (
          trailing
        )}
      </div>
    </PageToolbar>
  );
}

/** Clients page toolbar — search, status tabs, sort, view toggle. */
export function SkeletonClientsToolbar() {
  return (
    <SkeletonToolbar>
      <div className="flex w-full flex-1 flex-col gap-3 lg:flex-row lg:items-center">
        <Skeleton className="h-10 w-full rounded-lg lg:max-w-md" />
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <Skeleton className="h-9 w-[248px] rounded-lg" />
          <Skeleton className="h-9 w-[152px] rounded-lg" />
          <Skeleton className="h-9 w-[72px] rounded-lg" />
        </div>
      </div>
    </SkeletonToolbar>
  );
}

/** Projects page toolbar — search + status select. */
export function SkeletonProjectsToolbar() {
  return (
    <SkeletonToolbar>
      <div className="flex w-full flex-1 flex-col gap-3 sm:flex-row">
        <Skeleton className="h-10 w-full flex-1 rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg sm:w-[160px] sm:min-w-[160px]" />
      </div>
    </SkeletonToolbar>
  );
}

/** Transactions page toolbar — search, filter, new button. */
export function SkeletonTransactionsToolbar() {
  return (
    <SkeletonToolbar>
      <div className="flex w-full flex-1 flex-col gap-3 sm:flex-row">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg sm:w-[180px] sm:min-w-[180px]" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg sm:w-40" />
    </SkeletonToolbar>
  );
}

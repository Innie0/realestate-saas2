import clsx from 'clsx';
import type { ReactNode } from 'react';
import PageToolbar from '@/components/layout/PageToolbar';
import { Skeleton } from '@/components/ui/skeleton';

export function PageToolbarSkeleton({
  searchWidth = 'lg:max-w-md',
  filters = 4,
  showMeta = false,
  trailing,
}: {
  searchWidth?: string;
  filters?: number;
  showMeta?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <PageToolbar meta={showMeta ? ' ' : undefined}>
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 flex-1 w-full">
        <Skeleton className={clsx('h-10 w-full rounded-lg', searchWidth)} />
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          {Array.from({ length: filters }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-16 rounded-lg" />
          ))}
          {trailing}
        </div>
      </div>
    </PageToolbar>
  );
}

export function TableRowsSkeleton({
  columns,
  rows = 10,
  className,
}: {
  columns: Array<{ width?: string; align?: 'left' | 'right' }>;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={clsx('overflow-hidden rounded-lg border border-border bg-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={clsx(
                    'h-10 px-4 text-left font-medium text-muted-foreground',
                    column.align === 'right' && 'text-right',
                  )}
                >
                  <Skeleton className={clsx('h-3', column.width ?? 'w-16')} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border last:border-0">
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    {colIndex === 0 ? (
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-10 shrink-0 rounded-full" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ) : (
                      <Skeleton
                        className={clsx(
                          'h-4',
                          column.width ?? 'w-20',
                          column.align === 'right' && 'ml-auto',
                        )}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StackedCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-lg border border-border bg-card p-5 sm:p-[22px]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <Skeleton className="size-[38px] shrink-0 rounded-[10px]" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-56 max-w-full" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((__, statIndex) => (
              <div key={statIndex} className="space-y-1.5">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-border bg-card">
          <Skeleton className="h-[170px] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FormCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-lg border border-border bg-card p-5 sm:p-6">
          <Skeleton className="mb-4 h-5 w-32" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            {index === 0 ? <Skeleton className="h-10 w-full rounded-lg" /> : null}
          </div>
        </div>
      ))}
    </>
  );
}

export function DetailHeroSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="size-16 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailTwoColumnSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_336px]">
      <div className="space-y-4">
        <FormCardsSkeleton count={2} />
      </div>
      <FormCardsSkeleton count={1} />
    </div>
  );
}

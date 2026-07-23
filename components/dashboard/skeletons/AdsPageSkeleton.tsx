import { Card } from '@/components/ui/Card';
import PanelHeader from '@/components/ui/PanelHeader';
import { Skeleton } from '@/components/ui/skeleton';

export function AdsTabBarSkeleton() {
  return (
    <div className="flex w-fit gap-1 rounded-[10px] border border-[var(--border)] bg-[var(--canvas)] p-1">
      <Skeleton className="h-[36px] w-[108px] rounded-[8px]" />
      <Skeleton className="h-[36px] w-[120px] rounded-[8px]" />
    </div>
  );
}

export function AdsCreateWizardSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[210px_minmax(0,1fr)_minmax(260px,300px)] lg:items-start">
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-full rounded-lg" />
        ))}
      </div>
      <Card className="min-w-0 p-5 sm:p-6">
        <div className="mb-5 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-gray-150 pt-5">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <Skeleton className="mb-3 h-4 w-20" />
        <Skeleton className="aspect-[4/5] w-full rounded-lg" />
      </Card>
    </div>
  );
}

export function AdsPerformanceSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
      <Card className="overflow-hidden">
        <PanelHeader title="Campaign performance" />
        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-16 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-gray-200 bg-[var(--surface)] p-3">
                <Skeleton className="mb-2 h-3 w-12" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="border-b border-border px-4 py-3">
              <div className="flex gap-8">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-3 w-12" />
                ))}
              </div>
            </div>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex gap-8 border-b border-border px-4 py-3 last:border-0">
                {Array.from({ length: 6 }).map((__, colIndex) => (
                  <Skeleton key={colIndex} className="h-4 w-12" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>
      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function AdsPageBodySkeleton() {
  return (
    <>
      <AdsTabBarSkeleton />
      <AdsCreateWizardSkeleton />
    </>
  );
}

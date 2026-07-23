import { DashboardHomeContentSkeleton } from '@/components/dashboard/DashboardHomeSkeletons';

type PageLoadingVariant = 'default' | 'list' | 'detail' | 'account' | 'dashboard';

function HeaderSkeleton() {
  return (
    <div className="border-b border-gray-200 bg-[var(--surface)]/90 px-4 sm:px-7 py-2.5 sm:h-[52px] sm:py-0">
      <div className="flex h-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-baseline gap-2.5 animate-pulse">
          <div className="h-3.5 bg-gray-200 rounded w-24 max-w-full" />
          <div className="h-3 bg-gray-100 rounded w-48 max-w-full hidden sm:block" />
        </div>
        <div className="hidden sm:flex gap-2 animate-pulse">
          <div className="h-9 w-24 bg-gray-100 rounded-lg" />
          <div className="h-9 w-20 bg-gray-100 rounded-lg" />
        </div>
        <div className="flex items-center gap-3 animate-pulse shrink-0">
          <div className="h-9 w-9 bg-gray-100 rounded-lg" />
          <div className="h-8 w-8 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function SurfaceSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-[10px] bg-[var(--surface)] border border-gray-200 p-5 sm:p-6 animate-pulse space-y-3">
      <div className="h-5 bg-gray-200 rounded w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-100 rounded-lg" />
      ))}
    </div>
  );
}

export default function PageLoadingSkeleton({ variant = 'default' }: { variant?: PageLoadingVariant }) {
  return (
    <div className="min-h-screen">
      <HeaderSkeleton />
      <div className="px-4 sm:px-7 py-5 sm:py-6 mx-auto w-full max-w-7xl space-y-5">
        {variant === 'account' && (
          <>
            <SurfaceSkeleton lines={2} />
            <SurfaceSkeleton lines={2} />
            <SurfaceSkeleton lines={3} />
            <SurfaceSkeleton lines={2} />
          </>
        )}

        {variant === 'list' && (
          <>
            <div className="flex flex-col sm:flex-row gap-3 animate-pulse">
              <div className="h-10 bg-[var(--surface)] border border-gray-200 rounded-lg flex-1" />
              <div className="h-10 w-full sm:w-32 bg-gray-100 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-36 bg-[var(--surface)] border border-gray-200 rounded-[10px] animate-pulse" />
              ))}
            </div>
          </>
        )}

        {variant === 'detail' && (
          <>
            <div className="flex gap-2 animate-pulse">
              <div className="h-10 w-28 bg-gray-100 rounded-lg" />
              <div className="h-10 w-24 bg-gray-100 rounded-lg" />
            </div>
            <div className="grid lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-4">
                <SurfaceSkeleton lines={4} />
                <SurfaceSkeleton lines={6} />
              </div>
              <SurfaceSkeleton lines={5} />
            </div>
          </>
        )}

        {variant === 'dashboard' && <DashboardHomeContentSkeleton />}

        {variant === 'default' && (
          <>
            <div className="flex gap-1 p-1 bg-gray-100/80 rounded-lg animate-pulse max-w-md">
              <div className="flex-1 h-10 bg-[var(--surface)] rounded-md" />
              <div className="flex-1 h-10 bg-gray-50 rounded-md" />
              <div className="flex-1 h-10 bg-gray-50 rounded-md" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-[var(--surface)] rounded-[10px] border border-gray-200 animate-pulse" />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

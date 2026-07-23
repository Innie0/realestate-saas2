import { Skeleton } from '@/components/ui/skeleton';
import { DashboardHomeContentSkeleton } from '@/components/dashboard/DashboardHomeSkeletons';
import { SkeletonProjectGrid } from '@/components/skeletons/ProjectCard';
import { SkeletonFormCards } from '@/components/skeletons/FormCard';
import { SkeletonToolbar } from '@/components/skeletons/Toolbar';

type PageLoadingVariant = 'default' | 'list' | 'detail' | 'account' | 'dashboard';

function HeaderSkeleton() {
  return (
    <div className="border-b border-gray-200 bg-[var(--surface)]/90 px-4 sm:px-7 py-2.5 sm:h-[52px] sm:py-0">
      <div className="flex h-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-baseline gap-2.5">
          <Skeleton className="h-3.5 w-24 max-w-full" />
          <Skeleton className="hidden h-3 w-48 max-w-full sm:block" />
        </div>
        <div className="hidden gap-2 sm:flex">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** @deprecated Use route-level `loading.tsx` + `@/components/skeletons` instead. */
export default function PageLoadingSkeleton({ variant = 'default' }: { variant?: PageLoadingVariant }) {
  return (
    <div className="min-h-screen">
      <HeaderSkeleton />
      <div className="mx-auto w-full max-w-7xl space-y-5 px-4 py-5 sm:px-7 sm:py-6">
        {variant === 'account' && <SkeletonFormCards count={4} />}

        {variant === 'list' && (
          <>
            <SkeletonToolbar searchWidth="flex-1" filters={[128]} />
            <SkeletonProjectGrid />
          </>
        )}

        {variant === 'detail' && (
          <>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <SkeletonFormCards count={2} fields={4} />
              </div>
              <SkeletonFormCards count={1} fields={5} />
            </div>
          </>
        )}

        {variant === 'dashboard' && <DashboardHomeContentSkeleton />}

        {variant === 'default' && (
          <>
            <Skeleton className="h-10 max-w-md rounded-lg" />
            <SkeletonFormCards count={1} fields={4} />
          </>
        )}
      </div>
    </div>
  );
}

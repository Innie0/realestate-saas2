import PageToolbar from '@/components/layout/PageToolbar';
import { Skeleton } from '@/components/ui/skeleton';

const GRID_COUNT = 6;

export function ProjectsToolbarSkeleton() {
  return (
    <PageToolbar>
      <div className="flex w-full flex-1 flex-col gap-3 sm:flex-row">
        <Skeleton className="h-10 w-full flex-1 rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg sm:min-w-[160px] sm:w-[160px]" />
      </div>
    </PageToolbar>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-[var(--surface)]">
      <div className="relative h-[170px] w-full">
        <Skeleton className="h-full w-full rounded-none" />
        <Skeleton className="absolute right-2.5 top-2.5 h-6 w-20 rounded-full" />
      </div>
      <div className="p-4">
        <Skeleton className="h-[15px] w-3/4" />
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="mt-2 h-3 w-24" />
      </div>
    </div>
  );
}

export function ProjectsGridSkeleton({ count = GRID_COUNT }: { count?: number }) {
  return (
    <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
      {Array.from({ length: count }).map((_, index) => (
        <ProjectCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ProjectsListSkeleton() {
  return (
    <>
      <ProjectsToolbarSkeleton />
      <ProjectsGridSkeleton />
    </>
  );
}

import clsx from 'clsx';
import { Skeleton } from '@/components/ui/skeleton';
import { SKELETON_COUNTS } from '@/components/skeletons/constants';

export function SkeletonProjectCard({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'overflow-hidden rounded-xl border border-gray-200 bg-[var(--surface)]',
        className,
      )}
    >
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

export function SkeletonProjectGrid({
  count = SKELETON_COUNTS.projectsGrid,
}: {
  count?: number;
}) {
  return (
    <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonProjectCard key={index} />
      ))}
    </div>
  );
}

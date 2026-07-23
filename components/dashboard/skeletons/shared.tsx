import type { ReactNode } from 'react';
import { SkeletonDealList } from '@/components/skeletons/DealCard';
import {
  DetailHeroSkeleton,
  DetailTwoColumnSkeleton,
} from '@/components/skeletons/pages';
import { SkeletonProjectGrid } from '@/components/skeletons/ProjectCard';
import { SkeletonFormCards } from '@/components/skeletons/FormCard';
import { SkeletonToolbar } from '@/components/skeletons/Toolbar';
import { SkeletonTableShell } from '@/components/skeletons/Table';
import { SkeletonClientTableRow } from '@/components/skeletons/TableRow';
import { Skeleton } from '@/components/ui/skeleton';

/** @deprecated Use `SkeletonToolbar` from `@/components/skeletons`. */
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
    <SkeletonToolbar
      searchWidth={searchWidth}
      filters={Array.from({ length: filters }, () => 64)}
      trailing={trailing}
    />
  );
}

/** @deprecated Use `SkeletonTableShell` from `@/components/skeletons`. */
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
    <SkeletonTableShell
      className={className}
      headers={columns.map((_, i) => `Col ${i + 1}`)}
      rows={rows}
      renderRow={() => (
        <>
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
                <Skeleton className={column.width ?? 'h-4 w-20'} />
              )}
            </td>
          ))}
        </>
      )}
    />
  );
}

/** @deprecated Use `SkeletonDealList` from `@/components/skeletons`. */
export function StackedCardsSkeleton({ count = 4 }: { count?: number }) {
  return <SkeletonDealList count={count} />;
}

/** @deprecated Use `SkeletonProjectGrid` from `@/components/skeletons`. */
export function ProjectCardsSkeleton({ count = 6 }: { count?: number }) {
  return <SkeletonProjectGrid count={count} />;
}

/** @deprecated Use `SkeletonFormCards` from `@/components/skeletons`. */
export function FormCardsSkeleton(props: { count?: number }) {
  return <SkeletonFormCards count={props.count} />;
}

export { DetailHeroSkeleton, DetailTwoColumnSkeleton };

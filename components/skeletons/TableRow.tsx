import clsx from 'clsx';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell } from '@/components/ui/table';

/** Clients table row — avatar, interest subline, stage pill, two text cols. */
export function SkeletonClientTableRow() {
  return (
    <>
      <TableCell>
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-1.5 h-3 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-6 w-24 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
    </>
  );
}

/** Dashboard open-deals row — five compact columns. */
export function SkeletonOpenDealTableRow() {
  return (
    <>
      <TableCell className="max-w-[14rem] px-4 sm:max-w-[18rem] sm:px-5">
        <Skeleton className="h-4 w-36" />
      </TableCell>
      <TableCell className="max-w-[9rem] px-4 sm:px-5">
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="whitespace-nowrap px-4 sm:px-5">
        <Skeleton className="h-5 w-20 rounded-full" />
      </TableCell>
      <TableCell className="whitespace-nowrap px-4 text-right sm:px-5">
        <Skeleton className="ml-auto h-4 w-16" />
      </TableCell>
      <TableCell className="whitespace-nowrap px-4 text-right sm:px-5">
        <Skeleton className="ml-auto h-4 w-14" />
      </TableCell>
    </>
  );
}

/** Leads inbox list row — avatar, name + badge, summary, timestamp. */
export function SkeletonInboxRow({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0',
        className,
      )}
    >
      <Skeleton className="size-9 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-3 w-10 shrink-0" />
    </div>
  );
}

import { Skeleton } from '@/components/ui/skeleton';

export function TasksChatSkeleton() {
  return (
    <div className="grid h-[calc(100dvh-7.5rem)] min-h-[560px] grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col">
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="size-7 rounded-[8px]" />
        </div>
        <Skeleton className="h-[42px] w-full shrink-0 rounded-[10px]" />
        <div className="mt-3 min-h-0 flex-1 space-y-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-[52px] w-full rounded-[8px]" />
          ))}
        </div>
      </aside>
      <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <Skeleton className="size-14 rounded-full" />
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="border-t border-border p-4">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

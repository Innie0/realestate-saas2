import PageToolbar from '@/components/layout/PageToolbar';
import { Card } from '@/components/ui/Card';
import PanelHeader from '@/components/ui/PanelHeader';
import { Skeleton } from '@/components/ui/skeleton';

export function CalendarConnectionBannerSkeleton() {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 shrink-0 rounded-[10px]" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-72 max-w-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-36 shrink-0 rounded-lg" />
      </div>
    </Card>
  );
}

export function CalendarToolbarSkeleton() {
  return (
    <PageToolbar>
      <div className="ml-auto flex items-center gap-1">
        <Skeleton className="h-10 w-32 rounded-[8px]" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
    </PageToolbar>
  );
}

export function CalendarScheduleSkeleton() {
  return (
    <Card className="overflow-hidden">
      <PanelHeader title="Schedule" meta="Month view" />
      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-2">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square w-full rounded-md" />
          ))}
        </div>
      </div>
    </Card>
  );
}

export function CalendarPageBodySkeleton() {
  return (
    <>
      <CalendarConnectionBannerSkeleton />
      <CalendarToolbarSkeleton />
      <CalendarScheduleSkeleton />
    </>
  );
}

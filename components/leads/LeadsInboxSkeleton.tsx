import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/skeleton';

const LIST_ROWS = 6;

export function LeadsSectionSwitcherSkeleton() {
  return <Skeleton className="h-10 w-full max-w-xl rounded-lg" />;
}

export function LeadsInboxSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg sm:w-[280px]" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:items-start">
        <Card className="overflow-hidden p-0">
          <CardHeader className="border-b py-3">
            <CardTitle className="text-sm">Leads</CardTitle>
            <CardDescription>
              <Skeleton className="inline-block h-3 w-16" />
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-0 p-0">
            {Array.from({ length: LIST_ROWS }).map((_, index) => (
              <div
                key={index}
                className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0"
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
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden p-0">
          <CardHeader className="gap-3 border-b py-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-5 w-10 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex flex-wrap gap-2 pt-2">
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-9 w-32 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function LeadsInboxPageSkeleton() {
  return (
    <>
      <LeadsSectionSwitcherSkeleton />
      <LeadsInboxSkeleton />
    </>
  );
}

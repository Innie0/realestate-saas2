import { Card } from '@/components/ui/Card';
import PanelHeader from '@/components/ui/PanelHeader';
import { Skeleton } from '@/components/ui/skeleton';

export function PropertyResearchPageBodySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
      <div className="space-y-4">
        <Card className="space-y-3 p-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full rounded-[10px]" />
          <Skeleton className="h-10 w-full rounded-[10px]" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-10 w-full rounded-[10px]" />
            <Skeleton className="h-10 w-full rounded-[10px]" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </Card>
        <Card className="p-5">
          <Skeleton className="mb-3 h-4 w-24" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full rounded-md" />
            ))}
          </div>
        </Card>
      </div>
      <Card className="overflow-hidden">
        <PanelHeader title="Results" />
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-9 flex-1 rounded-md" />
            ))}
          </div>
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </Card>
    </div>
  );
}

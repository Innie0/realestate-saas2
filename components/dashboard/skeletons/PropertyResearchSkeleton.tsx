import { Card } from '@/components/ui/Card';
import PanelHeader from '@/components/ui/PanelHeader';
import { Skeleton } from '@/components/ui/skeleton';

export function PropertyResearchPageBodySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
      <div className="space-y-4">
        <Card className="space-y-3 p-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
        <Card className="overflow-hidden p-0">
          <PanelHeader title="Recent searches" />
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-md" />
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5 sm:p-[22px]">
        <Skeleton className="mb-2 h-5 w-40" />
        <Skeleton className="mb-5 h-4 w-full max-w-lg" />
        <Skeleton className="mb-3 h-10 w-full rounded-lg" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <Skeleton className="mt-5 h-9 w-36 rounded-lg" />
      </Card>
    </div>
  );
}

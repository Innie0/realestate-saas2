import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonFormCard({
  fields = 2,
  showSubmit = true,
}: {
  fields?: number;
  showSubmit?: boolean;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <Skeleton className="size-5 rounded-sm" />
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index} className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        {showSubmit ? <Skeleton className="h-10 w-32 rounded-lg" /> : null}
      </div>
    </Card>
  );
}

export function SkeletonFormCards({
  count = 3,
  fields = 2,
}: {
  count?: number;
  fields?: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonFormCard key={index} fields={index === 0 ? fields + 1 : fields} />
      ))}
    </>
  );
}

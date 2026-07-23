import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/skeleton';

export function AccountFormCardSkeleton({ fields = 2 }: { fields?: number }) {
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
        {fields >= 2 ? <Skeleton className="h-10 w-32 rounded-lg" /> : null}
      </div>
    </Card>
  );
}

export function AccountPageBodySkeleton() {
  return (
    <div className="space-y-5">
      <AccountFormCardSkeleton fields={2} />
      <AccountFormCardSkeleton fields={3} />
      <AccountFormCardSkeleton fields={2} />
      <AccountFormCardSkeleton fields={3} />
    </div>
  );
}

import PageToolbar from '@/components/layout/PageToolbar';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/skeleton';

const CARD_COUNT = 4;

export function TransactionsToolbarSkeleton() {
  return (
    <PageToolbar>
      <div className="flex w-full flex-1 flex-col gap-3 sm:flex-row">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg sm:min-w-[180px] sm:w-[180px]" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg sm:w-40" />
    </PageToolbar>
  );
}

export function TransactionDealCardSkeleton() {
  return (
    <Card className="p-5 sm:p-[22px]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <Skeleton className="size-[38px] shrink-0 rounded-[10px]" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-[17px] w-56 max-w-full" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-1.5">
            <Skeleton className="h-[11.5px] w-12" />
            <Skeleton className="h-[15px] w-20" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <Skeleton className="h-[13px] w-40" />
        <Skeleton className="size-4 rounded-sm" />
      </div>
    </Card>
  );
}

export function TransactionsListSkeleton() {
  return (
    <>
      <TransactionsToolbarSkeleton />
      <div className="space-y-3">
        {Array.from({ length: CARD_COUNT }).map((_, index) => (
          <TransactionDealCardSkeleton key={index} />
        ))}
      </div>
    </>
  );
}

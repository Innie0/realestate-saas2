import PageToolbar from '@/components/layout/PageToolbar';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const TABLE_ROWS = 8;
const COLUMN_HEADERS = ['Client', 'Interest', 'Stage', 'Last contact', 'Next follow-up'] as const;

export function ClientsToolbarSkeleton() {
  return (
    <PageToolbar>
      <div className="flex flex-col gap-3 flex-1 w-full lg:flex-row lg:items-center">
        <Skeleton className="h-10 w-full rounded-lg lg:max-w-md" />
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <Skeleton className="h-9 w-[248px] rounded-lg" />
          <Skeleton className="h-9 w-[152px] rounded-lg" />
          <Skeleton className="h-9 w-[72px] rounded-lg" />
        </div>
      </div>
    </PageToolbar>
  );
}

export function ClientsTableSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow>
              {COLUMN_HEADERS.map((heading) => (
                <TableHead key={heading}>{heading}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: TABLE_ROWS }).map((_, index) => (
              <TableRow key={index}>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

export function ClientsListSkeleton() {
  return (
    <>
      <ClientsToolbarSkeleton />
      <ClientsTableSkeleton />
    </>
  );
}

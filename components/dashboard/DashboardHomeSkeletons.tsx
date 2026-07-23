import clsx from 'clsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlanUsagePanelSkeleton } from '@/components/dashboard/PlanUsagePanel';

const OPEN_DEALS_ROWS = 6;
const TODAY_ROWS = 5;
const CONTINUE_ROWS = 3;
const ATTENTION_ROWS = 3;

export function MetricStripSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid grid-cols-2 divide-border lg:grid-cols-4 lg:divide-x lg:divide-y-0 divide-y">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="px-4 py-4 sm:px-5">
            <Skeleton className="h-3 w-20" />
            <div className="mt-2 flex items-end justify-between gap-2">
              <Skeleton className="h-7 w-16" />
              {index === 2 ? <Skeleton className="h-[26px] w-[72px] shrink-0 rounded-sm" /> : null}
            </div>
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function NeedsAttentionSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3 w-56" />
        </div>
        <Skeleton className="h-3 w-14" />
      </CardHeader>
      <CardContent className="flex flex-col gap-0 p-0">
        {Array.from({ length: ATTENTION_ROWS }).map((_, index) => (
          <div
            key={index}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 sm:px-5',
              index < ATTENTION_ROWS - 1 && 'border-b border-border',
            )}
          >
            <Skeleton className="size-2 shrink-0 rounded-full" />
            <Skeleton className="h-4 min-w-0 flex-1" />
            <Skeleton className="h-3 w-20 shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function OpenDealsTableSkeleton() {
  return (
    <Card className="flex h-full min-h-0 w-max max-w-full flex-col overflow-hidden p-0">
      <CardHeader className="flex-row items-center justify-between gap-8 space-y-0">
        <CardTitle>Open deals</CardTitle>
        <Skeleton className="h-3 w-28 shrink-0" />
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">
        <Table className="w-auto" containerClassName="w-max max-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap px-4 sm:px-5">Property</TableHead>
              <TableHead className="whitespace-nowrap px-4 sm:px-5">Client</TableHead>
              <TableHead className="whitespace-nowrap px-4 sm:px-5">Stage</TableHead>
              <TableHead className="whitespace-nowrap px-4 sm:px-5 text-right">Price</TableHead>
              <TableHead className="whitespace-nowrap px-4 sm:px-5 text-right">Closing</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: OPEN_DEALS_ROWS }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function TodayPanelSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Today</CardTitle>
        <Skeleton className="h-3 w-20 shrink-0" />
      </CardHeader>
      <CardContent className="flex flex-col gap-0 p-0">
        {Array.from({ length: TODAY_ROWS }).map((_, index) => (
          <div key={index} className="flex gap-3 px-4 py-2 sm:px-5">
            <Skeleton className="h-4 w-11 shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 border-l-2 border-transparent pl-2.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ContinuePanelSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <CardHeader>
        <CardTitle>Continue</CardTitle>
        <CardDescription>Pick up where you left off</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 p-0">
        {Array.from({ length: CONTINUE_ROWS }).map((_, index) => (
          <div key={index} className="flex items-center gap-2.5 px-4 py-2 sm:px-5">
            <Skeleton className="size-2 shrink-0 rounded-sm" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-3 w-3 shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function QuickActionsPanelSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 p-0">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-3 px-4 py-2 sm:px-5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-5 shrink-0 rounded border border-transparent" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DashboardWorkAreaSkeleton() {
  return (
    <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
      <div className="flex min-h-0 w-max max-w-full flex-col self-stretch">
        <OpenDealsTableSkeleton />
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <TodayPanelSkeleton />
        <ContinuePanelSkeleton />
        <QuickActionsPanelSkeleton />
      </div>
    </div>
  );
}

/** Mirrors the dashboard home content stack (metrics → attention → work area → plan usage). */
export function DashboardHomeContentSkeleton() {
  return (
    <>
      <MetricStripSkeleton />
      <NeedsAttentionSkeleton />
      <DashboardWorkAreaSkeleton />
      <PlanUsagePanelSkeleton layout="full" />
    </>
  );
}

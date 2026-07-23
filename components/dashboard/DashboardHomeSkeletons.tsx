import clsx from 'clsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlanUsagePanelSkeleton } from '@/components/dashboard/PlanUsagePanel';
import { SkeletonMetricStrip } from '@/components/skeletons/StatBlock';
import { SkeletonOpenDealTableRow } from '@/components/skeletons/TableRow';
import { OPEN_DEALS_HEADERS, SKELETON_COUNTS } from '@/components/skeletons/constants';

const { openDealsRows: OPEN_DEALS_ROWS, todayRows: TODAY_ROWS, continueRows: CONTINUE_ROWS, attentionRows: ATTENTION_ROWS } =
  SKELETON_COUNTS;

export function MetricStripSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <SkeletonMetricStrip count={4} badgeIndex={2} />
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
              {OPEN_DEALS_HEADERS.map((heading) => (
                <TableHead
                  key={heading}
                  className={clsx(
                    'whitespace-nowrap px-4 sm:px-5',
                    (heading === 'Price' || heading === 'Closing') && 'text-right',
                  )}
                >
                  {heading}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: OPEN_DEALS_ROWS }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                <SkeletonOpenDealTableRow />
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

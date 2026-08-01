import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonDealList } from '@/components/skeletons/DealCard';
import { SkeletonFormCards } from '@/components/skeletons/FormCard';
import { SkeletonProjectGrid } from '@/components/skeletons/ProjectCard';
import { SkeletonTableShell } from '@/components/skeletons/Table';
import { SkeletonClientTableRow, SkeletonInboxRow } from '@/components/skeletons/TableRow';
import {
  SkeletonClientsToolbar,
  SkeletonProjectsToolbar,
  SkeletonTransactionsToolbar,
} from '@/components/skeletons/Toolbar';
import {
  CLIENT_TABLE_HEADERS,
  SKELETON_COUNTS,
} from '@/components/skeletons/constants';

/* ── List pages ─────────────────────────────────────────────────────── */

export function ClientsTableSkeleton() {
  return (
    <SkeletonTableShell
      headers={CLIENT_TABLE_HEADERS}
      rows={SKELETON_COUNTS.clientsTableRows}
      tableClassName="min-w-[760px]"
      renderRow={() => <SkeletonClientTableRow />}
    />
  );
}

export { SkeletonClientsToolbar as ClientsToolbarSkeleton };

export function ClientsListSkeleton() {
  return (
    <>
      <SkeletonClientsToolbar />
      <ClientsTableSkeleton />
    </>
  );
}

export function ProjectsListSkeleton() {
  return (
    <>
      <SkeletonProjectsToolbar />
      <SkeletonProjectGrid />
    </>
  );
}

export function TransactionsListSkeleton() {
  return (
    <>
      <SkeletonTransactionsToolbar />
      <SkeletonDealList />
    </>
  );
}

/* ── Leads inbox ────────────────────────────────────────────────────── */

export function LeadsSectionSwitcherSkeleton() {
  return <Skeleton className="h-10 w-full max-w-xl rounded-lg" />;
}

export function LeadsInboxSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[220px_minmax(260px,320px)_minmax(0,1fr)] xl:items-start">
        <Card className="overflow-hidden p-0">
          <CardHeader className="border-b py-3">
            <CardTitle className="text-sm">Filters</CardTitle>
            <Skeleton className="h-3 w-20" />
          </CardHeader>
          <CardContent className="space-y-2 p-4">
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </CardContent>
        </Card>

        <Card className="overflow-hidden p-0">
          <CardHeader className="border-b py-3">
            <CardTitle className="text-sm">Leads</CardTitle>
            <div className="text-sm text-muted-foreground">
              <Skeleton className="inline-block h-3 w-16" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-0 p-0">
            {Array.from({ length: SKELETON_COUNTS.leadsInboxRows }).map((_, index) => (
              <SkeletonInboxRow key={index} />
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

/* ── Detail / form pages ────────────────────────────────────────────── */

export function DetailHeroSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="size-16 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 max-w-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailTwoColumnSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_336px]">
      <div className="space-y-4">
        <SkeletonFormCards count={2} />
      </div>
      <SkeletonFormCards count={1} />
    </div>
  );
}

export function LeadsSubpageContentSkeleton() {
  return <SkeletonFormCards count={3} />;
}

export function OpenHousesListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: SKELETON_COUNTS.openHouses }).map((_, index) => (
        <div key={index} className="rounded-lg border border-border bg-card p-5">
          <Skeleton className="mb-2 h-5 w-48" />
          <Skeleton className="mb-4 h-3 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NewProjectFormSkeleton() {
  return (
    <Card className="p-5 sm:p-6">
      <Skeleton className="mb-6 h-6 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className={index >= 8 ? 'sm:col-span-2' : ''}>
            <Skeleton className="mb-1.5 h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-6 h-24 w-full rounded-lg sm:col-span-2" />
      <div className="mt-6 flex gap-3">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </Card>
  );
}

export function BrandKitSkeleton() {
  return (
    <div className="space-y-5">
      <SkeletonFormCards count={3} fields={3} />
    </div>
  );
}

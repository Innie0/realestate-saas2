import Link from 'next/link';
import clsx from 'clsx';
import DashboardPage from '@/components/layout/DashboardPage';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlanUsagePanelSkeleton } from '@/components/dashboard/PlanUsagePanel';
import { DashboardHomeContentSkeleton } from '@/components/dashboard/DashboardHomeSkeletons';
import {
  DetailHeroSkeleton,
  DetailTwoColumnSkeleton,
  FormCardsSkeleton,
  PageToolbarSkeleton,
  ProjectCardsSkeleton,
  StackedCardsSkeleton,
  TableRowsSkeleton,
} from '@/components/dashboard/skeletons/shared';
import { Plus } from 'lucide-react';

/* ── Home (re-export) ─────────────────────────────────────────────────── */

export { DashboardHomeContentSkeleton };

export function DashboardHomeLoadingShell() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const subtitle = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <DashboardPage
      inline
      title={greeting}
      subtitle={subtitle}
      actions={
        <Link href="/dashboard/projects/new" data-tour="new-project">
          <Button size="sm" className="gap-2">
            New listing
            <span className="rounded bg-[var(--surface)]/[0.18] px-1 font-mono text-[10px] font-medium">N</span>
          </Button>
        </Link>
      }
    >
      <DashboardHomeContentSkeleton />
    </DashboardPage>
  );
}

/* ── Clients ──────────────────────────────────────────────────────────── */

export function ClientsPageContentSkeleton() {
  return (
    <TableRowsSkeleton
      columns={[
        { width: 'w-14' },
        { width: 'w-16' },
        { width: 'w-14' },
        { width: 'w-20' },
        { width: 'w-24' },
      ]}
      rows={10}
    />
  );
}

export function ClientsPageLoading() {
  return (
    <DashboardPage
      title="Clients"
      subtitle="Manage relationships, notes, and follow-ups"
      actions={
        <Button size="sm" disabled>
          <Plus className="mr-2 size-4" />
          New Client
        </Button>
      }
    >
      <PageToolbarSkeleton filters={3} trailing={<Skeleton className="h-9 w-9 rounded-lg" />} />
      <ClientsPageContentSkeleton />
    </DashboardPage>
  );
}

/* ── Projects ─────────────────────────────────────────────────────────── */

export function ProjectsPageContentSkeleton() {
  return <ProjectCardsSkeleton count={6} />;
}

export function ProjectsPageLoading() {
  return (
    <DashboardPage
      title="Projects"
      subtitle="Manage your property listing projects"
      actions={
        <Link href="/dashboard/projects/new">
          <Button size="sm" disabled>
            <Plus className="mr-2 size-4" />
            New Project
          </Button>
        </Link>
      }
    >
      <PageToolbarSkeleton searchWidth="flex-1" filters={1} />
      <ProjectsPageContentSkeleton />
    </DashboardPage>
  );
}

/* ── Transactions ─────────────────────────────────────────────────────── */

export function TransactionsPageContentSkeleton() {
  return <StackedCardsSkeleton count={4} />;
}

export function TransactionsPageLoading() {
  return (
    <DashboardPage title="Transactions" subtitle="Track deals, milestones, documents, and closing dates">
      <PageToolbarSkeleton searchWidth="flex-1" filters={1} trailing={<Skeleton className="h-10 w-36 rounded-lg" />} />
      <TransactionsPageContentSkeleton />
    </DashboardPage>
  );
}

/* ── Leads ────────────────────────────────────────────────────────────── */

export function LeadsInboxContentSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:items-start">
      <Card className="overflow-hidden p-0">
        <CardHeader className="border-b py-3">
          <Skeleton className="h-4 w-16" />
        </CardHeader>
        <CardContent className="flex flex-col gap-0 p-0">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="border-b border-border px-4 py-3 last:border-0">
              <Skeleton className="mb-1.5 h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="overflow-hidden p-0">
        <CardHeader className="border-b py-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-2 h-3 w-56" />
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function LeadsPageContentSkeleton() {
  return (
    <>
      <Skeleton className="h-10 w-full max-w-xl rounded-lg" />
      <LeadsInboxContentSkeleton />
    </>
  );
}

export function LeadsPageLoading() {
  return (
    <DashboardPage size="medium" title="Leads" subtitle="Inbox, capture, and automations">
      <LeadsPageContentSkeleton />
    </DashboardPage>
  );
}

/* ── Tasks ────────────────────────────────────────────────────────────── */

export function TasksPageContentSkeleton() {
  return (
    <div className="grid h-[calc(100dvh-7.5rem)] min-h-[560px] grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-[52px] w-full rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
          <Skeleton className="size-14 rounded-full" />
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="border-t border-border p-4">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function TasksPageLoading() {
  return (
    <DashboardPage title="AI Assistant" inline>
      <TasksPageContentSkeleton />
    </DashboardPage>
  );
}

/* ── Ads ──────────────────────────────────────────────────────────────── */

export function AdsPageContentSkeleton() {
  return (
    <>
      <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 flex-1 rounded-md" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-border bg-card p-3">
                <Skeleton className="mb-2 h-3 w-12" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
          <TableRowsSkeleton
            columns={[
              { width: 'w-24' },
              { width: 'w-12', align: 'right' },
              { width: 'w-12', align: 'right' },
              { width: 'w-12', align: 'right' },
              { width: 'w-12', align: 'right' },
              { width: 'w-12', align: 'right' },
            ]}
            rows={5}
          />
        </div>
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </>
  );
}

export function AdsPageLoading() {
  return (
    <DashboardPage title="Ads" subtitle="Manage Google Ads and Meta Ads campaigns from one place">
      <AdsPageContentSkeleton />
    </DashboardPage>
  );
}

/* ── Calendar ─────────────────────────────────────────────────────────── */

export function CalendarPageContentSkeleton() {
  return (
    <>
      <PageToolbarSkeleton filters={2} trailing={<Skeleton className="h-10 w-28 rounded-lg" />} />
      <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <div className="flex gap-2">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, index) => (
            <Skeleton key={index} className="aspect-square w-full rounded-md" />
          ))}
        </div>
      </div>
    </>
  );
}

export function CalendarPageLoading() {
  return (
    <DashboardPage title="Calendar" subtitle="Schedule showings, reminders, and synced events">
      <CalendarPageContentSkeleton />
    </DashboardPage>
  );
}

/* ── Account ──────────────────────────────────────────────────────────── */

export function AccountPageContentSkeleton() {
  return (
    <>
      <PlanUsagePanelSkeleton layout="full" />
      <FormCardsSkeleton count={4} />
    </>
  );
}

export function AccountPageLoading() {
  return (
    <DashboardPage title="Account" subtitle="Manage your profile, plan, and preferences" size="narrow">
      <AccountPageContentSkeleton />
    </DashboardPage>
  );
}

/* ── Property research ────────────────────────────────────────────────── */

export function PropertyResearchPageContentSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="rounded-lg border border-border bg-card p-5 space-y-2">
          <Skeleton className="mb-2 h-4 w-24" />
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-full rounded-md" />
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
        <div className="mb-4 flex gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-28 rounded-lg" />
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function PropertyResearchPageLoading() {
  return (
    <DashboardPage inline ambient="tool" title="Property Research" subtitle="Lookup, owner contact, and CMA">
      <PropertyResearchPageContentSkeleton />
    </DashboardPage>
  );
}

/* ── Client detail ────────────────────────────────────────────────────── */

export function ClientDetailPageContentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-32" />
      <DetailHeroSkeleton />
      <DetailTwoColumnSkeleton />
    </div>
  );
}

export function ClientDetailPageLoading() {
  return (
    <DashboardPage inline title="Client">
      <ClientDetailPageContentSkeleton />
    </DashboardPage>
  );
}

/* ── Project detail ───────────────────────────────────────────────────── */

export function ProjectDetailPageContentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
      <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1 max-w-md">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-10 flex-1 rounded-md" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[4/3] w-full rounded-lg" />
        ))}
      </div>
      <FormCardsSkeleton count={2} />
    </div>
  );
}

export function ProjectDetailPageLoading() {
  return (
    <DashboardPage title="Project">
      <ProjectDetailPageContentSkeleton />
    </DashboardPage>
  );
}

/* ── Transaction detail ───────────────────────────────────────────────── */

export function TransactionDetailPageContentSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64 max-w-full" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-28 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-lg border border-border bg-card p-4">
            <Skeleton className="mb-2 h-3 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
      <FormCardsSkeleton count={2} />
    </div>
  );
}

export function TransactionDetailPageLoading() {
  return (
    <DashboardPage title="Transaction">
      <TransactionDetailPageContentSkeleton />
    </DashboardPage>
  );
}

/* ── Leads sub-pages (narrow form layout) ─────────────────────────────── */

export function LeadsSubpageContentSkeleton() {
  return <FormCardsSkeleton count={3} />;
}

export function LeadsSubpageLoading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <DashboardPage size="narrow" inline title={title} subtitle={subtitle}>
      <Skeleton className="h-4 w-32" />
      <LeadsSubpageContentSkeleton />
    </DashboardPage>
  );
}

/* ── Upgrade ──────────────────────────────────────────────────────────── */

export function UpgradePageContentSkeleton() {
  return (
    <>
      <PlanUsagePanelSkeleton layout="full" />
      <div className="mx-auto max-w-xl space-y-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <Skeleton className="mx-auto mb-4 h-6 w-32" />
          <Skeleton className="mx-auto h-10 w-40 rounded-lg" />
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <Skeleton key={index} className={clsx('h-8 rounded-md', index % 3 === 0 ? 'col-span-1' : '')} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function UpgradePageLoading() {
  return (
    <DashboardPage size="medium" title="Upgrade" subtitle="Unlock Pro tools for your business">
      <UpgradePageContentSkeleton />
    </DashboardPage>
  );
}

/* ── Open houses list ─────────────────────────────────────────────────── */

export function OpenHousesPageContentSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
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

export function OpenHousesPageLoading() {
  return (
    <DashboardPage size="narrow" inline title="Open houses" subtitle="Capture leads at showings">
      <Skeleton className="h-10 w-full max-w-xl rounded-lg" />
      <OpenHousesPageContentSkeleton />
    </DashboardPage>
  );
}

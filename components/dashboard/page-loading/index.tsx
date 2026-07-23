import Link from 'next/link';
import clsx from 'clsx';
import DashboardPage from '@/components/layout/DashboardPage';
import Button from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlanUsagePanelSkeleton } from '@/components/dashboard/PlanUsagePanel';
import { DashboardHomeContentSkeleton } from '@/components/dashboard/DashboardHomeSkeletons';
import {
  AccountPageBodySkeleton,
  AdsPageBodySkeleton,
  BrandKitSkeleton,
  CalendarPageBodySkeleton,
  ClientsListSkeleton,
  DetailHeroSkeleton,
  DetailTwoColumnSkeleton,
  LeadsInboxPageSkeleton,
  LeadsInboxSkeleton,
  LeadsSubpageContentSkeleton,
  NewProjectFormSkeleton,
  OpenHousesListSkeleton,
  ProjectDetailPageContentSkeleton,
  ProjectDetailPageLoadingShell,
  ProjectsListSkeleton,
  PropertyResearchPageBodySkeleton,
  SkeletonFormCards,
  TasksChatSkeleton,
  TransactionsListSkeleton,
} from '@/components/skeletons';
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
  return <ClientsListSkeleton />;
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
      <ClientsPageContentSkeleton />
    </DashboardPage>
  );
}

/* ── Projects ─────────────────────────────────────────────────────────── */

export function ProjectsPageContentSkeleton() {
  return <ProjectsListSkeleton />;
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
      <ProjectsPageContentSkeleton />
    </DashboardPage>
  );
}

export function NewProjectPageLoading() {
  return (
    <DashboardPage title="New Project" subtitle="Create a property listing project">
      <NewProjectFormSkeleton />
    </DashboardPage>
  );
}

/* ── Transactions ─────────────────────────────────────────────────────── */

export function TransactionsPageContentSkeleton() {
  return <TransactionsListSkeleton />;
}

export function TransactionsPageLoading() {
  return (
    <DashboardPage title="Transactions" subtitle="Track deals, milestones, documents, and closing dates">
      <TransactionsPageContentSkeleton />
    </DashboardPage>
  );
}

export function NewTransactionPageLoading() {
  return (
    <DashboardPage title="New Transaction" subtitle="Track a new deal from offer to closing">
      <NewProjectFormSkeleton />
    </DashboardPage>
  );
}

/* ── Leads ────────────────────────────────────────────────────────────── */

export function LeadsInboxContentSkeleton() {
  return <LeadsInboxSkeleton />;
}

export function LeadsPageContentSkeleton() {
  return <LeadsInboxPageSkeleton />;
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
  return <TasksChatSkeleton />;
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
  return <AdsPageBodySkeleton />;
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
  return <CalendarPageBodySkeleton />;
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
      <AccountPageBodySkeleton />
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
  return <PropertyResearchPageBodySkeleton />;
}

export function PropertyResearchPageLoading() {
  return (
    <DashboardPage inline ambient="tool" title="Property Research" subtitle="Lookup, owner contact, and CMA">
      <PropertyResearchPageContentSkeleton />
    </DashboardPage>
  );
}

/* ── Brand kit ────────────────────────────────────────────────────────── */

export function BrandKitPageLoading() {
  return (
    <DashboardPage title="Brand Kit" subtitle="Logo, colors, and typography for your marketing">
      <BrandKitSkeleton />
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

export { ProjectDetailPageContentSkeleton };

export function ProjectDetailPageLoading() {
  return <ProjectDetailPageLoadingShell />;
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
      <SkeletonFormCards count={2} />
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

export function LeadsSubpageLoading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <DashboardPage size="narrow" inline title={title} subtitle={subtitle}>
      <Skeleton className="h-10 w-full max-w-xl rounded-lg" />
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
  return <OpenHousesListSkeleton />;
}

export function OpenHousesPageLoading() {
  return (
    <DashboardPage size="narrow" inline title="Open houses" subtitle="Capture leads at showings">
      <Skeleton className="h-10 w-full max-w-xl rounded-lg" />
      <OpenHousesPageContentSkeleton />
    </DashboardPage>
  );
}

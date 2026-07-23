'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import clsx from 'clsx';
import DashboardPage from '@/components/layout/DashboardPage';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import Sparkline from '@/components/ui/Sparkline';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import CountUp from '@/components/motion/CountUp';
import { fetchUpcomingItems, type UpcomingItem } from '@/components/NotificationsPanel';
import { DASHBOARD_UPCOMING_KEY } from '@/lib/dashboard-prefetch';
import PlanUsagePanel, { PlanUsagePanelSkeleton } from '@/components/dashboard/PlanUsagePanel';
import GettingStartedPanel from '@/components/dashboard/GettingStartedPanel';
import TransactionStatusBadge from '@/components/transactions/TransactionStatusBadge';
import { Plus, Home } from 'lucide-react';
import { Project } from '@/types';
import { useTour } from '@/hooks/useTour';
import { useApi } from '@/lib/swr';
import { getCurrentUser } from '@/lib/supabase';
import { isSameAddress } from '@/lib/comp-filters';
import { formatCompactPrice } from '@/lib/format-price';

interface RecentClient {
  id: string;
  name: string;
  created_at: string;
}

interface ReminderRow {
  id: string;
  reminder_date: string;
}

interface RecentTransaction {
  id: string;
  property_address: string;
  property_city?: string | null;
  buyer_name?: string | null;
  seller_name?: string | null;
  status: string;
  updated_at: string;
  offer_price?: number | null;
  closing_date?: string | null;
}

interface UsageData {
  [key: string]: { current: number; limit: number };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatToday() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

const QUICK_LINKS: ReadonlyArray<{
  href: string;
  label: string;
  shortcut: string;
  tour?: string;
}> = [
  { href: '/dashboard/projects/new', label: 'New listing project', shortcut: 'N', tour: 'new-project' },
  { href: '/dashboard/property-research', label: 'Research an address', shortcut: 'R' },
  { href: '/dashboard/tasks', label: 'Ask the AI assistant', shortcut: 'A' },
  { href: '/dashboard/clients', label: 'Add a client', shortcut: 'C', tour: 'manage-clients' },
];

/* ── Continue: pick up where you left off ────────────────────────────── */

type ContinueListItem = {
  key: string;
  kind: 'project' | 'transaction';
  href: string;
  title: string;
  subtitle: string;
};

function projectAddressLabel(project: Project): string {
  const info = project.property_info;
  if (info?.address?.trim()) {
    return [info.address, info.city, info.state, info.zip_code].filter(Boolean).join(', ');
  }
  return project.title;
}

function buildContinueListItems(
  recentProjects: Project[],
  allTransactions: RecentTransaction[],
): ContinueListItem[] {
  const items: ContinueListItem[] = [];
  const matchesExistingAddress = (address: string) =>
    items.some((item) => isSameAddress(item.title, address));

  const projectMatchesExisting = (project: Project) => {
    const label = projectAddressLabel(project);
    return (
      matchesExistingAddress(label) ||
      matchesExistingAddress(project.title) ||
      items.some(
        (item) =>
          item.kind === 'project' &&
          (isSameAddress(item.title, label) || isSameAddress(item.title, project.title)),
      )
    );
  };

  for (const project of recentProjects) {
    if (projectMatchesExisting(project)) continue;
    items.push({
      key: `project:${project.id}`,
      kind: 'project',
      href: `/dashboard/projects/${project.id}`,
      title: project.title,
      subtitle: project.status.replace('_', ' '),
    });
    if (items.length >= 3) return items;
  }

  for (const tx of allTransactions) {
    const duplicatesProject = recentProjects.some(
      (project) =>
        isSameAddress(projectAddressLabel(project), tx.property_address) ||
        isSameAddress(project.title, tx.property_address),
    );
    if (duplicatesProject || matchesExistingAddress(tx.property_address)) continue;
    items.push({
      key: `transaction:${tx.id}`,
      kind: 'transaction',
      href: `/dashboard/transactions/${tx.id}`,
      title: tx.property_address,
      subtitle: tx.status.replace('_', ' '),
    });
    if (items.length >= 3) break;
  }

  return items;
}

/** Bucket contact creation dates into trailing 7-day windows (oldest first). */
function weeklySeries(dates: string[], weeks = 8): number[] {
  const now = Date.now();
  const buckets = new Array(weeks).fill(0);
  for (const date of dates) {
    const age = now - new Date(date).getTime();
    if (age < 0) continue;
    const weekIndex = Math.floor(age / (7 * 24 * 3_600_000));
    if (weekIndex < weeks) buckets[weeks - 1 - weekIndex] += 1;
  }
  return buckets;
}

/* ── Metric strip — one joined surface, hairline dividers ─────────────── */

interface Metric {
  label: string;
  value: number;
  format?: (n: number) => string;
  placeholder?: string;
  sub: string;
  subTone: 'neutral' | 'positive' | 'warning';
  href: string;
  series?: number[];
  /** Brass accent for priority stats (hot leads, pipeline). */
  accent?: boolean;
}

function MetricStrip({ metrics }: { metrics: Metric[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid grid-cols-2 divide-border lg:grid-cols-4 lg:divide-x lg:divide-y-0 divide-y">
        {metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className={clsx(
              'group px-4 py-4 transition-colors hover:bg-muted/40 sm:px-5',
              m.accent && 'bg-accent/30',
            )}
          >
            <p className={clsx('text-label', m.accent && 'text-accent-foreground')}>{m.label}</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p
                className={clsx(
                  'text-2xl font-semibold tracking-tight tabular-nums leading-none text-foreground',
                  m.accent && 'text-foreground',
                )}
              >
                {m.placeholder ?? <CountUp value={m.value} format={m.format} />}
              </p>
              {m.series && m.series.some((v) => v > 0) && (
                <span className="shrink-0 text-foreground">
                  <Sparkline data={m.series} width={72} height={26} />
                </span>
              )}
            </div>
            <p
              className={clsx(
                'mt-2 text-xs leading-tight',
                m.subTone === 'positive' && 'text-emerald-600',
                m.subTone === 'warning' && 'text-amber-700',
                m.subTone === 'neutral' && 'text-muted-foreground',
              )}
            >
              {m.sub}
            </p>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function MetricStripSkeleton() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid grid-cols-2 gap-0 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 px-4 py-4 sm:px-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── Needs your attention ────────────────────────────────────────────── */

interface AttentionItem {
  key: string;
  dotClass: string;
  lead: string;
  rest: string;
  actionLabel: string;
  href: string;
}

function NeedsAttention({ items, loading }: { items: AttentionItem[]; loading: boolean }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) return null;

  return (
    <Card className="overflow-hidden p-0">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Needs your attention</CardTitle>
          <CardDescription>Urgent items that need a response today</CardDescription>
        </div>
        <span className="font-mono text-[10px] font-medium tracking-wide text-muted-foreground">
          {items.length} ITEM{items.length === 1 ? '' : 'S'}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 p-0">
        {items.map((item, i) => (
          <Link
            key={item.key}
            href={item.href}
            className={clsx(
              'group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5',
              i < items.length - 1 && 'border-b border-border',
            )}
          >
            <span className={clsx('size-2 shrink-0 rounded-full', item.dotClass)} aria-hidden />
            <p className="min-w-0 flex-1 truncate text-sm text-foreground">
              <span className="font-semibold">{item.lead}</span> {item.rest}
            </p>
            <span className="shrink-0 text-xs font-medium text-primary">{item.actionLabel} →</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

/* ── Open deals table ────────────────────────────────────────────────── */

function formatClosing(date?: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function OpenDealsTable({
  transactions,
  loading,
}: {
  transactions: RecentTransaction[];
  loading: boolean;
}) {
  const deals = transactions.slice(0, 6);

  return (
    <Card className="flex h-full min-h-0 w-max max-w-full flex-col overflow-hidden p-0">
      <CardHeader className="flex-row items-center justify-between gap-8 space-y-0">
        <CardTitle>Open deals</CardTitle>
        <Link href="/dashboard/transactions" className="shrink-0 text-xs font-medium text-primary hover:underline">
          All transactions →
        </Link>
      </CardHeader>

      {loading ? (
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
              {Array.from({ length: 6 }).map((_, rowIndex) => (
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
      ) : deals.length === 0 ? (
        <CardContent className="flex flex-1 flex-col justify-center py-6">
          <EmptyState
            icon={Home}
            title="No open deals"
            description="Start a transaction to track milestones, documents, and closings."
            className="py-6"
            action={
              <Link href="/dashboard/transactions/new">
                <Button size="sm">
                  <Plus className="mr-1.5 size-4" />
                  New deal
                </Button>
              </Link>
            }
          />
        </CardContent>
      ) : (
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
              {deals.map((tx) => (
                <TableRow key={tx.id} className="group">
                  <TableCell className="max-w-[14rem] px-4 font-medium sm:max-w-[18rem] sm:px-5">
                    <Link href={`/dashboard/transactions/${tx.id}`} className="block truncate hover:underline">
                      {tx.property_address}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[9rem] truncate px-4 text-muted-foreground sm:px-5">
                    {tx.buyer_name || tx.seller_name || '—'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-4 sm:px-5">
                    <TransactionStatusBadge status={tx.status} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-4 text-right font-mono tabular-nums sm:px-5">
                    {tx.offer_price ? formatCompactPrice(tx.offer_price) : '—'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-4 text-right text-muted-foreground sm:px-5">
                    {formatClosing(tx.closing_date)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
}

/* ── Today (right rail) ──────────────────────────────────────────────── */

function timeLabel(dateString: string): string {
  const d = new Date(dateString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function isPast(dateString: string): boolean {
  return new Date(dateString).getTime() < Date.now();
}

function TodayPanel() {
  const { data: items = [], isLoading } = useSWR<UpcomingItem[]>(
    DASHBOARD_UPCOMING_KEY,
    fetchUpcomingItems,
    { revalidateOnFocus: false, dedupingInterval: 120_000 },
  );

  const todayItems = useMemo(() => {
    const now = new Date();
    return items
      .filter((item) => {
        const d = new Date(item.date);
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .slice(0, 5);
  }, [items]);

  return (
    <Card className="overflow-hidden p-0" data-tour="notifications">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Today</CardTitle>
        <Link href="/dashboard/calendar" className="text-xs font-medium text-primary hover:underline">
          Calendar →
        </Link>
      </CardHeader>
      {isLoading ? (
        <CardContent className="flex flex-col gap-0 p-0">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-3 px-4 py-2 sm:px-5">
              <Skeleton className="h-4 w-11 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 border-l-2 border-transparent pl-2.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      ) : todayItems.length === 0 ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">Nothing scheduled today.</p>
        </CardContent>
      ) : (
        <CardContent className="flex flex-col gap-0 p-0">
          {todayItems.map((item) => {
            const overdue = item.type === 'reminder' && isPast(item.date);
            const isShowing = item.type === 'event' && item.eventType === 'showing';
            const borderClass = overdue
              ? 'border-amber-600'
              : isShowing
                ? 'border-foreground'
                : 'border-muted-foreground/40';
            return (
              <div key={item.id} className="flex gap-3 px-4 py-2 transition-colors hover:bg-muted/40 sm:px-5">
                <span className="w-11 shrink-0 pt-px font-mono text-xs font-medium text-muted-foreground">
                  {timeLabel(item.date)}
                </span>
                <div className={clsx('border-l-2 pl-2.5', borderClass)}>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  {(item.description || item.clientName || item.location) && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.description || item.clientName || item.location}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}

/* ── Continue (right rail) ───────────────────────────────────────────── */

function ContinuePanel({ items, loading }: { items: ContinueListItem[]; loading: boolean }) {
  return (
    <Card className="overflow-hidden p-0">
      <CardHeader>
        <CardTitle>Continue</CardTitle>
        <CardDescription>Pick up where you left off</CardDescription>
      </CardHeader>
      {loading ? (
        <CardContent className="flex flex-col gap-0 p-0">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2.5 px-4 py-2 sm:px-5">
              <Skeleton className="size-2 shrink-0 rounded-sm" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </CardContent>
      ) : items.length === 0 ? (
        <CardContent>
          <p className="text-sm text-muted-foreground">Nothing in progress. Create a listing to get started.</p>
        </CardContent>
      ) : (
        <CardContent className="flex flex-col gap-0 p-0">
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="group flex items-center gap-2.5 px-4 py-2 transition-colors hover:bg-muted/40 sm:px-5"
            >
              <span
                className={clsx(
                  'size-2 shrink-0 rounded-sm border-[1.5px]',
                  item.kind === 'project' ? 'border-amber-600' : 'border-foreground',
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                <p className="truncate text-xs capitalize text-muted-foreground">{item.subtitle}</p>
              </div>
              <span className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground">→</span>
            </Link>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

function QuickActionsPanel() {
  return (
    <Card className="overflow-hidden p-0">
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 p-0">
        {QUICK_LINKS.map(({ href, label, shortcut, tour }) => (
          <Link
            key={href}
            href={href}
            data-tour={tour}
            className="group flex items-center justify-between gap-3 px-4 py-2 transition-colors hover:bg-muted/40 sm:px-5"
          >
            <span className="truncate text-sm text-foreground">{label}</span>
            <kbd className="flex h-5 min-w-5 items-center justify-center rounded border border-border px-1 font-mono text-[10px] font-medium text-muted-foreground">
              {shortcut}
            </kbd>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export default function DashboardHomePage() {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showGettingStarted, setShowGettingStarted] = useState(false);
  const [firstName, setFirstName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { user } = await getCurrentUser();
        const fullName = user?.user_metadata?.full_name as string | undefined;
        if (fullName) setFirstName(fullName.split(' ')[0]);
      } catch {
        // non-critical — greeting just omits the name
      }
    })();
  }, []);

  const { response: usageResponse, isLoading: usageLoading } = useApi<UsageData>('/api/usage');
  const { data: recentProjects = [], isLoading: projectsLoading } = useApi<Project[]>('/api/projects?limit=3');
  const { data: inboxLeads = [], isLoading: leadsLoading } = useApi<RecentClient[]>('/api/clients?status=all&view=inbox');
  const { data: allContacts = [], isLoading: contactsLoading } = useApi<RecentClient[]>('/api/clients?status=all');
  const { data: allTransactions = [], isLoading: transactionsLoading } = useApi<RecentTransaction[]>('/api/transactions?status=open');
  const { data: activeReminders = [], isLoading: remindersLoading } = useApi<ReminderRow[]>('/api/reminders?include_completed=false');

  const usage = usageResponse?.data ?? null;
  const plan = (usageResponse?.plan as 'starter' | 'pro') ?? 'starter';
  const loading = usageLoading && !usage;

  const hotLeadCount = useMemo(
    () =>
      inboxLeads.filter(
        (l) => Date.now() - new Date(l.created_at).getTime() < 48 * 3_600_000,
      ).length,
    [inboxLeads],
  );

  const overdueReminderCount = useMemo(
    () => activeReminders.filter((r) => new Date(r.reminder_date).getTime() < Date.now()).length,
    [activeReminders],
  );

  const leadSeries = useMemo(
    () => weeklySeries(allContacts.map((c) => c.created_at)),
    [allContacts],
  );

  const { newLeads7d, newLeadsPrior7d } = useMemo(() => {
    const now = Date.now();
    const week = 7 * 24 * 3_600_000;
    let current = 0;
    let prior = 0;
    for (const contact of allContacts) {
      const age = now - new Date(contact.created_at).getTime();
      if (age < week) current += 1;
      else if (age < 2 * week) prior += 1;
    }
    return { newLeads7d: current, newLeadsPrior7d: prior };
  }, [allContacts]);

  const { pipelineValue, closingSoonCount } = useMemo(() => {
    const soonCutoff = Date.now() + 14 * 24 * 3_600_000;
    let value = 0;
    let closingSoon = 0;
    for (const tx of allTransactions) {
      value += Number(tx.offer_price) || 0;
      if (tx.closing_date && new Date(tx.closing_date).getTime() <= soonCutoff) {
        closingSoon += 1;
      }
    }
    return { pipelineValue: value, closingSoonCount: closingSoon };
  }, [allTransactions]);

  const dueThisWeekCount = useMemo(() => {
    const weekAhead = Date.now() + 7 * 24 * 3_600_000;
    return activeReminders.filter((r) => {
      const t = new Date(r.reminder_date).getTime();
      return t >= Date.now() && t <= weekAhead;
    }).length;
  }, [activeReminders]);

  const metricsLoading =
    (contactsLoading || transactionsLoading || remindersLoading) &&
    allContacts.length === 0 &&
    allTransactions.length === 0 &&
    activeReminders.length === 0;

  const leadDelta = newLeads7d - newLeadsPrior7d;

  const metrics = useMemo<Metric[]>(
    () => [
      {
        label: 'Hot leads',
        value: hotLeadCount,
        sub: hotLeadCount > 0 ? 'Reply within 48h' : 'Inbox handled',
        subTone: hotLeadCount > 0 ? 'warning' : 'neutral',
        href: '/dashboard/leads',
        accent: true,
      },
      {
        label: 'Pipeline',
        value: pipelineValue,
        format: (n) => formatCompactPrice(n),
        placeholder: pipelineValue > 0 ? undefined : '—',
        sub: `${allTransactions.length} open${closingSoonCount > 0 ? ` · ${closingSoonCount} closing soon` : ''}`,
        subTone: closingSoonCount > 0 ? 'warning' : 'neutral',
        href: '/dashboard/transactions',
        accent: true,
      },
      {
        label: 'New leads · 7d',
        value: newLeads7d,
        sub:
          leadDelta > 0
            ? `+${leadDelta} vs last week`
            : leadDelta < 0
              ? `${leadDelta} vs last week`
              : 'Same as last week',
        subTone: leadDelta > 0 ? 'positive' : 'neutral',
        href: '/dashboard/leads',
        series: leadSeries,
      },
      {
        label: 'Follow-ups',
        value: overdueReminderCount + dueThisWeekCount,
        sub:
          overdueReminderCount > 0
            ? `${overdueReminderCount} overdue`
            : dueThisWeekCount > 0
              ? 'Due this week'
              : 'All caught up',
        subTone: overdueReminderCount > 0 ? 'warning' : 'neutral',
        href: '/dashboard/clients',
      },
    ],
    [
      newLeads7d,
      leadDelta,
      leadSeries,
      hotLeadCount,
      pipelineValue,
      allTransactions.length,
      closingSoonCount,
      overdueReminderCount,
      dueThisWeekCount,
    ],
  );

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];
    if (hotLeadCount > 0) {
      items.push({
        key: 'hot-leads',
        dotClass: 'bg-brand-500',
        lead: `${hotLeadCount} hot lead${hotLeadCount === 1 ? '' : 's'}`,
        rest: 'waiting under 48h in your inbox',
        actionLabel: 'Open inbox',
        href: '/dashboard/leads',
      });
    }
    if (overdueReminderCount > 0) {
      items.push({
        key: 'overdue-followups',
        dotClass: 'bg-amber-600',
        lead: `${overdueReminderCount} overdue follow-up${overdueReminderCount === 1 ? '' : 's'}`,
        rest: 'need a response',
        actionLabel: 'Review',
        href: '/dashboard/clients',
      });
    }
    if (closingSoonCount > 0) {
      items.push({
        key: 'closing-soon',
        dotClass: 'bg-amber-600',
        lead: `${closingSoonCount} deal${closingSoonCount === 1 ? '' : 's'}`,
        rest: 'closing within 2 weeks',
        actionLabel: 'View deals',
        href: '/dashboard/transactions',
      });
    }
    if (items.length === 0 && inboxLeads.length > 0) {
      items.push({
        key: 'inbox-leads',
        dotClass: 'bg-gray-300',
        lead: `${inboxLeads.length} new inbox lead${inboxLeads.length === 1 ? '' : 's'}`,
        rest: 'to review',
        actionLabel: 'Open inbox',
        href: '/dashboard/leads',
      });
    }
    return items;
  }, [hotLeadCount, overdueReminderCount, closingSoonCount, inboxLeads.length]);

  const attentionLoading =
    (leadsLoading || remindersLoading) && inboxLeads.length === 0 && activeReminders.length === 0;

  const continueListItems = useMemo(
    () => buildContinueListItems(recentProjects, allTransactions),
    [recentProjects, allTransactions],
  );

  const continueLoading =
    (projectsLoading || transactionsLoading) && recentProjects.length === 0 && allTransactions.length === 0;

  // Keyboard shortcuts for quick actions (N / R / A / C).
  const handleShortcut = useCallback(
    (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return;
      }
      const match = QUICK_LINKS.find((l) => l.shortcut.toLowerCase() === e.key.toLowerCase());
      if (match) {
        e.preventDefault();
        router.push(match.href);
      }
    },
    [router],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [handleShortcut]);

  useTour({
    tourKey: 'tour_dashboard',
    ready: !loading,
    steps: [
      {
        element: '[data-tour="new-project"]',
        popover: {
          title: 'Create a listing project',
          description: 'Generate AI-powered descriptions, social posts, and listing content for any property.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="manage-clients"]',
        popover: {
          title: 'Your clients',
          description: 'View and manage clients and leads in one place.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="notifications"]',
        popover: {
          title: 'Your schedule',
          description: 'Reminders and calendar events for today show up here.',
          side: 'top',
        },
      },
      {
        element: '[data-tour="plan-usage"]',
        popover: {
          title: 'Plan usage',
          description:
            plan === 'pro'
              ? 'You are on Pro with unlimited access on most tools.'
              : 'Track monthly usage and upgrade when you need more.',
          side: 'top',
        },
      },
    ],
  });

  useEffect(() => {
    document.title = 'Today - Oikaro';
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('welcome') === 'true') {
      setShowWelcome(true);
      params.delete('welcome');
      const next = params.toString();
      window.history.replaceState({}, '', next ? `/dashboard?${next}` : '/dashboard');
    } else if (localStorage.getItem('oikaro_getting_started_dismissed') !== '1') {
      setShowGettingStarted(true);
    }
  }, []);

  const dismissGettingStarted = () => {
    setShowWelcome(false);
    setShowGettingStarted(false);
    localStorage.setItem('oikaro_getting_started_dismissed', '1');
  };

  // Wait for workspace lists to finish loading — otherwise empty defaults flash
  // the Getting Started card for a frame on every refresh.
  const workspaceListsReady =
    !projectsLoading && !leadsLoading && !transactionsLoading;

  const showOnboarding =
    (showWelcome || showGettingStarted) &&
    workspaceListsReady &&
    recentProjects.length === 0 &&
    inboxLeads.length === 0 &&
    allTransactions.length === 0;

  return (
    <DashboardPage
      inline
      title={`${getGreeting()}${firstName ? `, ${firstName}` : ''}`}
      subtitle={formatToday()}
      actions={
        <>
          {overdueReminderCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-[6px] border border-amber-100 bg-amber-50 px-2.5 py-1 text-[12px] font-medium text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
              {overdueReminderCount} follow-up{overdueReminderCount === 1 ? '' : 's'} overdue
            </span>
          )}
          <Link href="/dashboard/projects/new" data-tour="new-project">
            <Button size="sm" className="gap-2">
              New listing
              <span className="rounded bg-[var(--surface)]/[0.18] px-1 font-mono text-[10px] font-medium">N</span>
            </Button>
          </Link>
        </>
      }
    >
      {showOnboarding && (
        <GettingStartedPanel
          variant={showWelcome ? 'welcome' : 'empty'}
          onDismiss={dismissGettingStarted}
        />
      )}

      {/* 1. Business pulse — hot leads, pipeline, new leads, follow-ups */}
      {metricsLoading ? <MetricStripSkeleton /> : <MetricStrip metrics={metrics} />}

      {/* 2. Action queue */}
      <NeedsAttention items={attentionItems} loading={attentionLoading} />

      {/* 3. Work area + right rail */}
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex min-h-0 w-max max-w-full flex-col self-stretch">
          <OpenDealsTable transactions={allTransactions} loading={transactionsLoading && allTransactions.length === 0} />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <TodayPanel />
          <ContinuePanel items={continueListItems} loading={continueLoading} />
          <QuickActionsPanel />
        </div>
      </div>

      {/* 4. Plan usage — full width */}
      <div data-tour="plan-usage">
        {usage ? (
          <PlanUsagePanel usage={usage} plan={plan} layout="full" />
        ) : usageLoading ? (
          <PlanUsagePanelSkeleton layout="full" />
        ) : null}
      </div>
    </DashboardPage>
  );
}

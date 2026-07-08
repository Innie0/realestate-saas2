'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import Header from '@/components/layout/Header';
import PageShell from '@/components/layout/PageShell';
import PageTransition from '@/components/motion/PageTransition';
import StaggerList, { StaggerItem } from '@/components/motion/StaggerList';
import Surface from '@/components/ui/Surface';
import Sparkline from '@/components/ui/Sparkline';
import Button from '@/components/ui/Button';
import NotificationsPanel from '@/components/NotificationsPanel';
import PlanUsagePanel, { PlanUsagePanelSkeleton } from '@/components/dashboard/PlanUsagePanel';
import MarketplaceSummaryPanel from '@/components/dashboard/MarketplaceSummaryPanel';
import GettingStartedPanel from '@/components/dashboard/GettingStartedPanel';
import {
  Plus,
  ArrowRight,
  Inbox,
  Flame,
  Search,
  Sparkles,
  FolderKanban,
  FileText,
  Calendar,
  AlertCircle,
  TrendingUp,
  CircleDollarSign,
  BellRing,
} from 'lucide-react';
import CountUp from '@/components/motion/CountUp';
import { ACCENT, type Accent } from '@/lib/accent';
import { Project } from '@/types';
import { useTour } from '@/hooks/useTour';
import { useApi } from '@/lib/swr';
import { isSameAddress } from '@/lib/comp-filters';

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
  icon: React.ElementType;
  accent: Accent;
  tour?: string;
}> = [
  { href: '/dashboard/projects/new', label: 'New listing', icon: Plus, accent: 'amber', tour: 'new-project' },
  { href: '/dashboard/leads', label: 'Leads inbox', icon: Inbox, accent: 'sky' },
  { href: '/dashboard/property-research', label: 'Property research', icon: Search, accent: 'violet' },
  { href: '/dashboard/tasks', label: 'AI assistant', icon: Sparkles, accent: 'violet' },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar, accent: 'rose' },
  { href: '/dashboard/clients', label: 'Clients', icon: FolderKanban, accent: 'teal', tour: 'manage-clients' },
];

type ContinueListItem =
  | {
      key: string;
      kind: 'project';
      href: string;
      title: string;
      subtitle: string;
    }
  | {
      key: string;
      kind: 'transaction';
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

function ContinueSection({
  loading,
  items,
}: {
  loading: boolean;
  items: ContinueListItem[];
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-label mb-1">Continue</p>
          <h2 className="text-title font-semibold tracking-tight text-gray-900">Pick up where you left off</h2>
        </div>
        <Link
          href="/dashboard/projects"
          className="text-caption text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
        >
          All projects <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <Surface key={i} padding="sm" className="flex items-center gap-4 animate-pulse min-h-[4.5rem]">
              <div className="p-2.5 rounded-xl bg-gray-100 h-10 w-10 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded-lg w-48 max-w-full" />
                <div className="h-3 bg-gray-100 rounded-lg w-20" />
              </div>
            </Surface>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <Link key={item.key} href={item.href}>
              <Surface padding="sm" hover className="flex items-center gap-4 group">
                <div
                  className={clsx(
                    'flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-transform duration-200 group-hover:scale-105',
                    item.kind === 'project' ? ACCENT.amber.chip : ACCENT.emerald.chip,
                  )}
                >
                  {item.kind === 'project' ? (
                    <FolderKanban className="w-4 h-4" strokeWidth={1.75} />
                  ) : (
                    <FileText className="w-4 h-4" strokeWidth={1.75} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-caption text-gray-500 capitalize">{item.subtitle}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors shrink-0" />
              </Surface>
            </Link>
          ))}
        </div>
      ) : (
        <Surface padding="md" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-gray-300 shrink-0" />
            <div>
              <p className="text-body font-medium text-gray-900">No recent work yet</p>
              <p className="text-caption text-gray-500 mt-0.5">Create a listing project to get started with AI content.</p>
            </div>
          </div>
          <Link href="/dashboard/projects/new" data-tour="new-project" className="shrink-0">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New listing
            </Button>
          </Link>
        </Surface>
      )}
    </div>
  );
}

interface UrgentItem {
  key: string;
  icon: React.ElementType;
  iconClass: string;
  accentClass: string;
  title: string;
  subtitle: string;
  href: string;
}

function UrgentQueue({ items, loading }: { items: UrgentItem[]; loading: boolean }) {
  if (loading) {
    return (
      <Surface padding="md" className="animate-pulse">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gray-100 h-9 w-9 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded w-56 max-w-full" />
            <div className="h-3 bg-gray-100 rounded w-72 max-w-full" />
          </div>
        </div>
      </Surface>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-label">Needs your attention</p>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.key} href={item.href}>
            <Surface
              padding="md"
              hover
              className="relative overflow-hidden flex items-center gap-3.5"
            >
              <span className={`absolute left-0 inset-y-0 w-[3px] ${item.accentClass}`} aria-hidden />
              <div className={`flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${item.iconClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body font-semibold text-gray-900">{item.title}</p>
                <p className="text-caption text-gray-500 mt-0.5">{item.subtitle}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
            </Surface>
          </Link>
        );
      })}
    </div>
  );
}

function QuickActionsStrip() {
  return (
    <div>
      <p className="text-label mb-2">Quick actions</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {QUICK_LINKS.map(({ href, label, icon: Icon, accent, tour }) => (
          <Link
            key={href}
            href={href}
            data-tour={tour}
            className="group flex items-center gap-2.5 rounded-xl bg-white ring-1 ring-gray-900/[0.04] shadow-surface px-3 py-2.5 hover:shadow-raised hover:ring-gray-900/[0.07] hover:-translate-y-px transition-all duration-200"
          >
            <span
              className={clsx(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110',
                ACCENT[accent].chip,
              )}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
            </span>
            <span className="text-[13px] font-medium text-gray-700 group-hover:text-gray-900 leading-tight truncate">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Business pulse — the numbers that matter, at a glance ─────────── */

const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

interface MetricCardProps {
  label: string;
  value: number;
  format?: (n: number) => string;
  /** Static display when the value isn't a plain number (e.g. em dash). */
  placeholder?: string;
  sub: string;
  subTone?: 'neutral' | 'positive' | 'warning';
  href: string;
  series?: number[];
  icon: React.ElementType;
  accent: Accent;
}

const SPARK_TEXT: Record<Accent, string> = {
  violet: 'text-brand-500',
  sky: 'text-sky-500',
  teal: 'text-teal-500',
  emerald: 'text-emerald-500',
  amber: 'text-amber-500',
  rose: 'text-rose-500',
  gray: 'text-gray-400',
};

function MetricCard({
  label,
  value,
  format,
  placeholder,
  sub,
  subTone = 'neutral',
  href,
  series,
  icon: Icon,
  accent,
}: MetricCardProps) {
  return (
    <StaggerItem className="h-full">
    <Link href={href} className="block h-full group">
      <Surface padding="sm" hover className="h-full relative overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <p className="text-label">{label}</p>
          <span
            className={clsx(
              'flex h-6 w-6 items-center justify-center rounded-md transition-transform duration-200 group-hover:scale-110',
              ACCENT[accent].chip,
            )}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
          </span>
        </div>
        <p className="mt-1.5 text-[26px] font-semibold tracking-tight tabular-nums text-gray-900 leading-none">
          {placeholder ?? <CountUp value={value} format={format} />}
        </p>
        <div className="mt-2 flex items-end justify-between gap-2 min-h-[28px]">
          <p
            className={clsx(
              'text-caption leading-tight',
              subTone === 'positive' && 'text-emerald-600',
              subTone === 'warning' && 'text-amber-600',
              subTone === 'neutral' && 'text-gray-500',
            )}
          >
            {sub}
          </p>
          {series && series.some((v) => v > 0) && (
            <span className={clsx('shrink-0', SPARK_TEXT[accent])}>
              <Sparkline data={series} />
            </span>
          )}
        </div>
      </Surface>
    </Link>
    </StaggerItem>
  );
}

function MetricRowSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <Surface key={i} padding="sm" className="animate-pulse">
          <div className="h-3 bg-gray-100 rounded w-20 mb-3" />
          <div className="h-7 bg-gray-100 rounded w-16 mb-3" />
          <div className="h-3 bg-gray-100 rounded w-24" />
        </Surface>
      ))}
    </div>
  );
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

export default function DashboardPage() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showGettingStarted, setShowGettingStarted] = useState(false);

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

  // ── Business pulse metrics ──────────────────────────────────────────
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

  const focusMessage = useMemo(() => {
    if (leadsLoading && inboxLeads.length === 0) {
      return 'Loading your workspace';
    }
    if (hotLeadCount > 0) {
      return `${hotLeadCount} hot lead${hotLeadCount === 1 ? '' : 's'} need${hotLeadCount === 1 ? 's' : ''} a response`;
    }
    if (overdueReminderCount > 0) {
      return `${overdueReminderCount} follow-up${overdueReminderCount === 1 ? '' : 's'} overdue`;
    }
    if (inboxLeads.length > 0) {
      return `${inboxLeads.length} lead${inboxLeads.length === 1 ? '' : 's'} waiting in your inbox`;
    }
    return 'Your workspace is clear — start something new';
  }, [hotLeadCount, overdueReminderCount, inboxLeads.length, leadsLoading]);

  const urgentItems = useMemo<UrgentItem[]>(() => {
    const items: UrgentItem[] = [];
    if (hotLeadCount > 0) {
      items.push({
        key: 'hot-leads',
        icon: Flame,
        iconClass: 'bg-rose-50 text-rose-600 ring-1 ring-rose-100',
        accentClass: 'bg-rose-500',
        title: `Respond to ${hotLeadCount} hot lead${hotLeadCount === 1 ? '' : 's'}`,
        subtitle: 'Leads under 48 hours convert best when you reply quickly.',
        href: '/dashboard/leads',
      });
    }
    if (overdueReminderCount > 0) {
      items.push({
        key: 'overdue-followups',
        icon: AlertCircle,
        iconClass: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
        accentClass: 'bg-amber-400',
        title: `${overdueReminderCount} overdue follow-up${overdueReminderCount === 1 ? '' : 's'}`,
        subtitle: 'Clients or reminders waiting on a reply from you.',
        href: '/dashboard/clients',
      });
    }
    if (items.length === 0 && inboxLeads.length > 0) {
      items.push({
        key: 'inbox-leads',
        icon: Inbox,
        iconClass: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200/70',
        accentClass: 'bg-gray-300',
        title: `Review ${inboxLeads.length} inbox lead${inboxLeads.length === 1 ? '' : 's'}`,
        subtitle: 'New captures are waiting to be added to your CRM.',
        href: '/dashboard/leads',
      });
    }
    return items;
  }, [hotLeadCount, overdueReminderCount, inboxLeads.length]);

  const urgentLoading = (leadsLoading || remindersLoading) && inboxLeads.length === 0 && activeReminders.length === 0;

  const continueListItems = useMemo(
    () => buildContinueListItems(recentProjects, allTransactions),
    [recentProjects, allTransactions],
  );

  const continueLoading =
    (projectsLoading || transactionsLoading) && recentProjects.length === 0 && allTransactions.length === 0;

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
          description: 'Reminders and calendar events for the next 7 days show up here.',
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
    document.title = 'Today - Realestic';
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('welcome') === 'true') {
      setShowWelcome(true);
      params.delete('welcome');
      const next = params.toString();
      window.history.replaceState({}, '', next ? `/dashboard?${next}` : '/dashboard');
    } else if (localStorage.getItem('realestic_getting_started_dismissed') !== '1') {
      setShowGettingStarted(true);
    }
  }, []);

  const dismissGettingStarted = () => {
    setShowWelcome(false);
    setShowGettingStarted(false);
    localStorage.setItem('realestic_getting_started_dismissed', '1');
  };

  const showOnboarding =
    (showWelcome || showGettingStarted) &&
    !loading &&
    recentProjects.length === 0 &&
    inboxLeads.length === 0 &&
    allTransactions.length === 0;

  return (
    <div>
      <Header title={getGreeting()} subtitle={`${formatToday()} · ${focusMessage}`} />

      <PageShell>
        <PageTransition className="space-y-6">
        {showOnboarding && (
          <GettingStartedPanel
            variant={showWelcome ? 'welcome' : 'empty'}
            onDismiss={dismissGettingStarted}
          />
        )}

        {/* 1. Business pulse — how the business is actually doing */}
        {metricsLoading ? (
          <MetricRowSkeleton />
        ) : (
          <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="New leads · 7d"
              value={newLeads7d}
              icon={TrendingUp}
              accent="sky"
              sub={
                leadDelta > 0
                  ? `+${leadDelta} vs last week`
                  : leadDelta < 0
                    ? `${leadDelta} vs last week`
                    : 'Same as last week'
              }
              subTone={leadDelta > 0 ? 'positive' : 'neutral'}
              href="/dashboard/leads"
              series={leadSeries}
            />
            <MetricCard
              label="Hot leads"
              value={hotLeadCount}
              icon={Flame}
              accent="rose"
              sub={hotLeadCount > 0 ? 'Reply within 48h' : 'Inbox handled'}
              subTone={hotLeadCount > 0 ? 'warning' : 'neutral'}
              href="/dashboard/leads"
            />
            <MetricCard
              label="Pipeline"
              value={pipelineValue}
              format={(n) => compactCurrency.format(n)}
              placeholder={pipelineValue > 0 ? undefined : '—'}
              icon={CircleDollarSign}
              accent="emerald"
              sub={`${allTransactions.length} open deal${allTransactions.length === 1 ? '' : 's'}${
                closingSoonCount > 0 ? ` · ${closingSoonCount} closing soon` : ''
              }`}
              subTone={closingSoonCount > 0 ? 'warning' : 'neutral'}
              href="/dashboard/transactions"
            />
            <MetricCard
              label="Follow-ups"
              value={overdueReminderCount + dueThisWeekCount}
              icon={BellRing}
              accent="amber"
              sub={
                overdueReminderCount > 0
                  ? `${overdueReminderCount} overdue`
                  : dueThisWeekCount > 0
                    ? 'Due this week'
                    : 'All caught up'
              }
              subTone={overdueReminderCount > 0 ? 'warning' : 'neutral'}
              href="/dashboard/clients"
            />
          </StaggerList>
        )}

        {/* 2. Urgent — what needs a response right now */}
        <UrgentQueue items={urgentItems} loading={urgentLoading} />

        {/* 3. Quick actions — jump straight into the most common tools */}
        <QuickActionsStrip />

        {/* 3. Continue work */}
        <ContinueSection loading={continueLoading} items={continueListItems} />

        {/* 4. Today's schedule */}
        <div data-tour="notifications">
          <NotificationsPanel embedded />
        </div>

        {/* 5. Secondary info — plan usage + marketplace activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {usage ? (
            <PlanUsagePanel usage={usage} plan={plan} layout="sidebar" />
          ) : usageLoading ? (
            <PlanUsagePanelSkeleton layout="sidebar" />
          ) : null}
          <MarketplaceSummaryPanel />
        </div>
        </PageTransition>
      </PageShell>
    </div>
  );
}

'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import clsx from 'clsx';
import Header from '@/components/layout/Header';
import PageTransition from '@/components/motion/PageTransition';
import Surface from '@/components/ui/Surface';
import Sparkline from '@/components/ui/Sparkline';
import Button from '@/components/ui/Button';
import CountUp from '@/components/motion/CountUp';
import { fetchUpcomingItems, type UpcomingItem } from '@/components/NotificationsPanel';
import PlanUsagePanel, { PlanUsagePanelSkeleton } from '@/components/dashboard/PlanUsagePanel';
import GettingStartedPanel from '@/components/dashboard/GettingStartedPanel';
import TransactionStatusBadge from '@/components/transactions/TransactionStatusBadge';
import { Plus } from 'lucide-react';
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
}

function MetricStrip({ metrics }: { metrics: Metric[] }) {
  return (
    <Surface flat padding="none" className="overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y divide-gray-150 lg:divide-y-0 lg:divide-x lg:divide-gray-150">
        {metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="group px-5 py-4 transition-colors hover:bg-gray-50"
          >
            <p className="text-label">{m.label}</p>
            <div className="mt-2.5 flex items-end justify-between gap-2">
              <p className="text-[26px] font-semibold tracking-[-0.02em] tabular-nums text-gray-900 leading-none">
                {m.placeholder ?? <CountUp value={m.value} format={m.format} />}
              </p>
              {m.series && m.series.some((v) => v > 0) && (
                <span className="text-gray-900 shrink-0 -mb-0.5">
                  <Sparkline data={m.series} width={72} height={26} />
                </span>
              )}
            </div>
            <p
              className={clsx(
                'text-[12px] mt-2 leading-tight',
                m.subTone === 'positive' && 'text-emerald-600',
                m.subTone === 'warning' && 'text-amber-700',
                m.subTone === 'neutral' && 'text-gray-700',
              )}
            >
              {m.sub}
            </p>
          </Link>
        ))}
      </div>
    </Surface>
  );
}

function MetricStripSkeleton() {
  return (
    <Surface flat padding="none" className="overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y divide-gray-150 lg:divide-y-0 lg:divide-x lg:divide-gray-150">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="px-5 py-4 animate-pulse">
            <div className="h-3 bg-gray-100 rounded w-20" />
            <div className="h-7 bg-gray-100 rounded w-16 mt-3" />
            <div className="h-3 bg-gray-100 rounded w-24 mt-3" />
          </div>
        ))}
      </div>
    </Surface>
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
      <Surface flat padding="md" className="animate-pulse">
        <div className="h-3 bg-gray-100 rounded w-40 mb-4" />
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-4 bg-gray-100 rounded w-3/4" />
          ))}
        </div>
      </Surface>
    );
  }

  if (items.length === 0) return null;

  return (
    <Surface flat padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-[11px] border-b border-gray-150">
        <h2 className="text-[12.5px] font-semibold text-gray-900">Needs your attention</h2>
        <span className="font-mono text-[10.5px] font-medium text-gray-600 tracking-[0.04em]">
          {items.length} ITEM{items.length === 1 ? '' : 'S'}
        </span>
      </div>
      <div>
        {items.map((item, i) => (
          <Link
            key={item.key}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-4 py-[11px] transition-colors hover:bg-gray-50',
              i < items.length - 1 && 'border-b border-gray-150',
            )}
          >
            <span className={clsx('h-[7px] w-[7px] rounded-full shrink-0', item.dotClass)} aria-hidden />
            <p className="flex-1 min-w-0 text-[13px] text-gray-900 truncate">
              <span className="font-semibold">{item.lead}</span> {item.rest}
            </p>
            <span className="text-[11.5px] font-medium text-gray-900 shrink-0">
              {item.actionLabel} →
            </span>
          </Link>
        ))}
      </div>
    </Surface>
  );
}

/* ── Open deals table ────────────────────────────────────────────────── */

const DEAL_COL_WIDTHS = ['36.1%', '19.7%', '16.4%', '14.7%', '13.1%'];

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
    <Surface flat padding="none" className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-[11px] border-b border-gray-150 shrink-0">
        <h2 className="text-[12.5px] font-semibold text-gray-900">Open deals</h2>
        <Link
          href="/dashboard/transactions"
          className="text-[11.5px] font-medium text-gray-900 hover:opacity-70 transition-opacity"
        >
          All transactions →
        </Link>
      </div>

      {loading ? (
        <div className="flex-1 px-4 py-4 space-y-3 animate-pulse min-h-0">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-5 bg-gray-100 rounded" />
          ))}
        </div>
      ) : deals.length === 0 ? (
        <div className="flex-1 px-4 pb-6 pt-3 flex items-start justify-between gap-4 min-h-0">
          <div>
            <p className="text-body font-medium text-gray-900">No open deals</p>
            <p className="text-caption text-gray-700 mt-0.5">
              Start a transaction to track milestones and closings.
            </p>
          </div>
          <Link href="/dashboard/transactions/new" className="shrink-0">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              New deal
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="overflow-x-auto shrink-0">
            <table className="w-full min-w-[560px] text-left table-fixed">
            <colgroup>
              {DEAL_COL_WIDTHS.map((w, i) => (
                <col key={i} style={{ width: w }} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-gray-150 bg-gray-50">
                {['Property', 'Client', 'Stage', 'Price', 'Closing'].map((h) => (
                  <th
                    key={h}
                    className={clsx(
                      'px-4 py-[7px] font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-600',
                      (h === 'Price' || h === 'Closing') && 'text-right',
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deals.map((tx, i) => (
                <tr
                  key={tx.id}
                  className={clsx(
                    'group transition-colors hover:bg-gray-50',
                    i < deals.length - 1 && 'border-b border-gray-150',
                  )}
                >
                  <td className="px-4 py-[11px] max-w-0">
                    <Link href={`/dashboard/transactions/${tx.id}`} className="block">
                      <p className="text-[13px] font-medium text-gray-900 truncate">
                        {tx.property_address}
                      </p>
                    </Link>
                  </td>
                  <td className="px-4 py-[11px] text-[12.5px] text-gray-700 truncate">
                    {tx.buyer_name || tx.seller_name || '—'}
                  </td>
                  <td className="px-4 py-[11px]">
                    <TransactionStatusBadge status={tx.status} />
                  </td>
                  <td className="px-4 py-[11px] text-right font-mono text-[12.5px] font-medium text-gray-900 tabular-nums whitespace-nowrap">
                    {tx.offer_price ? formatCompactPrice(tx.offer_price) : '—'}
                  </td>
                  <td className="px-4 py-[11px] text-right text-[12.5px] text-gray-700 whitespace-nowrap">
                    {formatClosing(tx.closing_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </Surface>
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
  const { data: items = [], isLoading } = useSWR<UpcomingItem[]>('dashboard-upcoming', fetchUpcomingItems);

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
    <Surface flat padding="none" className="overflow-hidden" data-tour="notifications">
      <div className="flex items-center justify-between px-4 py-[11px] border-b border-gray-150">
        <h2 className="text-[12.5px] font-semibold text-gray-900">Today</h2>
        <Link
          href="/dashboard/calendar"
          className="text-[11.5px] font-medium text-gray-900 hover:opacity-70 transition-opacity"
        >
          Calendar →
        </Link>
      </div>
      {isLoading ? (
        <div className="px-4 py-3 space-y-3 animate-pulse">
          {[0, 1].map((i) => (
            <div key={i} className="h-8 bg-gray-100 rounded" />
          ))}
        </div>
      ) : todayItems.length === 0 ? (
        <p className="px-4 py-4 text-caption text-gray-700">Nothing scheduled today.</p>
      ) : (
        <div className="py-1.5">
          {todayItems.map((item) => {
            const overdue = item.type === 'reminder' && isPast(item.date);
            const isShowing = item.type === 'event' && item.eventType === 'showing';
            const borderClass = overdue
              ? 'border-amber-600'
              : isShowing
                ? 'border-gray-900'
                : 'border-gray-300';
            return (
              <div key={item.id} className="flex gap-3 px-4 py-[9px] transition-colors hover:bg-gray-50">
                <span className="w-11 shrink-0 pt-px font-mono text-[11.5px] font-medium text-gray-600">
                  {timeLabel(item.date)}
                </span>
                <div className={clsx('border-l-2 pl-2.5', borderClass)}>
                  <p className="text-[12.5px] font-medium text-gray-900">{item.title}</p>
                  {(item.description || item.clientName || item.location) && (
                    <p className="mt-0.5 text-[11.5px] text-gray-700 truncate">
                      {item.description || item.clientName || item.location}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Surface>
  );
}

/* ── Continue (right rail) ───────────────────────────────────────────── */

function ContinuePanel({ items, loading }: { items: ContinueListItem[]; loading: boolean }) {
  return (
    <Surface flat padding="none" className="overflow-hidden">
      <div className="px-4 py-[11px] border-b border-gray-150">
        <h2 className="text-[12.5px] font-semibold text-gray-900">Continue</h2>
      </div>
      {loading ? (
        <div className="px-4 py-3 space-y-3 animate-pulse">
          {[0, 1].map((i) => (
            <div key={i} className="h-4 bg-gray-100 rounded" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="px-4 py-4 text-caption text-gray-700">
          Nothing in progress. Create a listing to get started.
        </p>
      ) : (
        <div className="py-1.5">
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="group flex items-center gap-2.5 px-4 py-[9px] transition-colors hover:bg-gray-50"
            >
              <span
                className={clsx(
                  'h-2 w-2 shrink-0 rounded-[2px] border-[1.5px]',
                  item.kind === 'project' ? 'border-amber-600' : 'border-gray-900',
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-medium text-gray-900 truncate">{item.title}</p>
                <p className="text-[11.5px] text-gray-700 capitalize truncate">{item.subtitle}</p>
              </div>
              <span className="text-gray-400 group-hover:text-gray-700 transition-colors shrink-0">→</span>
            </Link>
          ))}
        </div>
      )}
    </Surface>
  );
}

/* ── Quick actions with keyboard shortcuts (right rail) ──────────────── */

function QuickActionsPanel() {
  return (
    <Surface flat padding="none" className="overflow-hidden">
      <div className="px-4 py-[11px] border-b border-gray-150">
        <h2 className="text-[12.5px] font-semibold text-gray-900">Quick actions</h2>
      </div>
      <div className="py-1.5">
        {QUICK_LINKS.map(({ href, label, shortcut, tour }) => (
          <Link
            key={href}
            href={href}
            data-tour={tour}
            className="group flex items-center justify-between gap-3 px-4 py-[7px] transition-colors hover:bg-gray-50"
          >
            <span className="text-[12.5px] text-gray-900 truncate">{label}</span>
            <kbd className="flex h-5 min-w-[20px] items-center justify-center rounded border border-gray-200 px-1 font-mono text-[10px] font-medium text-gray-600 shrink-0">
              {shortcut}
            </kbd>
          </Link>
        ))}
      </div>
    </Surface>
  );
}

export default function DashboardPage() {
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
        label: 'Hot leads',
        value: hotLeadCount,
        sub: hotLeadCount > 0 ? 'Reply within 48h' : 'Inbox handled',
        subTone: hotLeadCount > 0 ? 'warning' : 'neutral',
        href: '/dashboard/leads',
      },
      {
        label: 'Pipeline',
        value: pipelineValue,
        format: (n) => formatCompactPrice(n),
        placeholder: pipelineValue > 0 ? undefined : '—',
        sub: `${allTransactions.length} open${closingSoonCount > 0 ? ` · ${closingSoonCount} closing soon` : ''}`,
        subTone: closingSoonCount > 0 ? 'warning' : 'neutral',
        href: '/dashboard/transactions',
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
        dotClass: 'bg-rose-600',
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

  const showOnboarding =
    (showWelcome || showGettingStarted) &&
    !loading &&
    recentProjects.length === 0 &&
    inboxLeads.length === 0 &&
    allTransactions.length === 0;

  return (
    <div>
      <Header
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
      />

      <PageTransition className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-7 sm:py-6 space-y-5">
        {showOnboarding && (
          <GettingStartedPanel
            variant={showWelcome ? 'welcome' : 'empty'}
            onDismiss={dismissGettingStarted}
          />
        )}

        {/* 1. Metric strip */}
        {metricsLoading ? <MetricStripSkeleton /> : <MetricStrip metrics={metrics} />}

        {/* 2. Two-column console layout — left flexible, right rail fixed 340px */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-stretch">
          <div className="flex flex-col gap-5 min-w-0 h-full">
            <NeedsAttention items={attentionItems} loading={attentionLoading} />
            <OpenDealsTable transactions={allTransactions} loading={transactionsLoading && allTransactions.length === 0} />
          </div>
          <div className="flex flex-col gap-5 min-w-0">
            <TodayPanel />
            <ContinuePanel items={continueListItems} loading={continueLoading} />
            <QuickActionsPanel />
          </div>
        </div>

        {/* 3. Plan usage — full width */}
        <div data-tour="plan-usage">
          {usage ? (
            <PlanUsagePanel usage={usage} plan={plan} layout="full" />
          ) : usageLoading ? (
            <PlanUsagePanelSkeleton layout="full" />
          ) : null}
        </div>
      </PageTransition>
    </div>
  );
}

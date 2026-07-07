'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PageShell from '@/components/layout/PageShell';
import PageTransition from '@/components/motion/PageTransition';
import Surface from '@/components/ui/Surface';
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
} from 'lucide-react';
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

const QUICK_LINKS = [
  { href: '/dashboard/projects/new', label: 'New listing', icon: Plus, tour: 'new-project' },
  { href: '/dashboard/leads', label: 'Leads inbox', icon: Inbox },
  { href: '/dashboard/property-research', label: 'Property research', icon: Search },
  { href: '/dashboard/tasks', label: 'AI assistant', icon: Sparkles },
  { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { href: '/dashboard/clients', label: 'Clients', icon: FolderKanban, tour: 'manage-clients' },
] as const;

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
                  className={`p-2.5 rounded-xl shrink-0 ${
                    item.kind === 'project'
                      ? 'bg-brand-50 text-brand-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {item.kind === 'project' ? (
                    <FolderKanban className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
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
  title: string;
  subtitle: string;
  href: string;
}

function UrgentQueue({ items, loading }: { items: UrgentItem[]; loading: boolean }) {
  if (loading) {
    return (
      <Surface padding="md" className="animate-pulse">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gray-100 h-10 w-10 shrink-0" />
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
              className="flex items-center gap-3 bg-gradient-to-r from-white to-brand-50/30"
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${item.iconClass}`}>
                <Icon className="w-5 h-5" />
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
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {QUICK_LINKS.map(({ href, label, icon: Icon, ...rest }) => (
          <Link
            key={href}
            href={href}
            data-tour={'tour' in rest ? rest.tour : undefined}
            className="group flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3.5 px-2 text-center hover:border-brand-300 hover:shadow-sm transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-brand-50 transition-colors">
              <Icon className="w-4 h-4 text-gray-500 group-hover:text-brand-600 transition-colors" />
            </div>
            <span className="text-[11px] font-medium text-gray-600 group-hover:text-gray-900 leading-tight">
              {label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showGettingStarted, setShowGettingStarted] = useState(false);

  const { response: usageResponse, isLoading: usageLoading } = useApi<UsageData>('/api/usage');
  const { data: recentProjects = [], isLoading: projectsLoading } = useApi<Project[]>('/api/projects?limit=3');
  const { data: inboxLeads = [], isLoading: leadsLoading } = useApi<RecentClient[]>('/api/clients?status=all&view=inbox');
  const { data: allTransactions = [], isLoading: transactionsLoading } = useApi<RecentTransaction[]>('/api/transactions?limit=3');
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
        iconClass: 'bg-red-50 text-red-600',
        title: `Respond to ${hotLeadCount} hot lead${hotLeadCount === 1 ? '' : 's'}`,
        subtitle: 'Leads under 48 hours convert best when you reply quickly.',
        href: '/dashboard/leads',
      });
    }
    if (overdueReminderCount > 0) {
      items.push({
        key: 'overdue-followups',
        icon: AlertCircle,
        iconClass: 'bg-amber-50 text-amber-600',
        title: `${overdueReminderCount} overdue follow-up${overdueReminderCount === 1 ? '' : 's'}`,
        subtitle: 'Clients or reminders waiting on a reply from you.',
        href: '/dashboard/clients',
      });
    }
    if (items.length === 0 && inboxLeads.length > 0) {
      items.push({
        key: 'inbox-leads',
        icon: Inbox,
        iconClass: 'bg-gray-100 text-gray-600',
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

        {/* 1. Urgent — what needs a response right now */}
        <UrgentQueue items={urgentItems} loading={urgentLoading} />

        {/* 2. Quick actions — jump straight into the most common tools */}
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

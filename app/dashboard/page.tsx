'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PageShell from '@/components/layout/PageShell';
import Surface from '@/components/ui/Surface';
import Button from '@/components/ui/Button';
import NotificationsPanel from '@/components/NotificationsPanel';
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
} from 'lucide-react';
import { Project } from '@/types';
import { useTour } from '@/hooks/useTour';
import { useApi } from '@/lib/swr';

interface RecentClient {
  id: string;
  name: string;
  created_at: string;
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

const USAGE_KEYS = [
  { key: 'projects', label: 'Projects' },
  { key: 'property_lookups', label: 'Lookups' },
  { key: 'ai_messages', label: 'AI messages' },
] as const;

export default function DashboardPage() {
  const { response: usageResponse, isLoading: usageLoading } = useApi<UsageData>('/api/usage');
  const { data: recentProjects = [], isLoading: projectsLoading } = useApi<Project[]>('/api/projects?limit=3');
  const { data: inboxLeads = [] } = useApi<RecentClient[]>('/api/clients?status=all&view=inbox');
  const { data: allTransactions = [] } = useApi<RecentTransaction[]>('/api/transactions?limit=3');

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

  const focusMessage = useMemo(() => {
    if (hotLeadCount > 0) {
      return `${hotLeadCount} hot lead${hotLeadCount === 1 ? '' : 's'} need${hotLeadCount === 1 ? 's' : ''} a response`;
    }
    if (inboxLeads.length > 0) {
      return `${inboxLeads.length} lead${inboxLeads.length === 1 ? '' : 's'} waiting in your inbox`;
    }
    return 'Your workspace is clear — start something new';
  }, [hotLeadCount, inboxLeads.length]);

  const continueItem = useMemo(() => {
    const latestProject = recentProjects[0];
    const latestTx = allTransactions[0];
    if (!latestProject && !latestTx) return null;
    if (!latestTx) return { type: 'project' as const, item: latestProject };
    if (!latestProject) return { type: 'transaction' as const, item: latestTx };
    const projectTime = new Date(latestProject.updated_at || latestProject.created_at).getTime();
    const txTime = new Date(latestTx.updated_at).getTime();
    return txTime > projectTime
      ? { type: 'transaction' as const, item: latestTx }
      : { type: 'project' as const, item: latestProject };
  }, [recentProjects, allTransactions]);

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

  return (
    <div className="min-h-screen">
      <Header title={getGreeting()} subtitle={`${formatToday()} · ${focusMessage}`} />

      <PageShell className="space-y-8">
        {/* Primary focus */}
        {(hotLeadCount > 0 || inboxLeads.length > 0) && (
          <Link href="/dashboard/leads">
            <Surface
              padding="md"
              hover
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-white to-brand-50/40"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-label mb-1">Priority</p>
                  <p className="text-title font-semibold text-gray-900">
                    {hotLeadCount > 0
                      ? `Respond to ${hotLeadCount} hot lead${hotLeadCount === 1 ? '' : 's'}`
                      : `Review ${inboxLeads.length} inbox lead${inboxLeads.length === 1 ? '' : 's'}`}
                  </p>
                  <p className="text-caption text-gray-500 mt-1">
                    Leads under 48 hours convert best when you reply quickly.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-body font-medium text-brand-600 shrink-0">
                Open leads <ArrowRight className="w-4 h-4" />
              </span>
            </Surface>
          </Link>
        )}

        {/* Today layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
          <div className="lg:col-span-2 space-y-5" data-tour="notifications">
            <NotificationsPanel embedded />
          </div>

          <div className="space-y-5">
            <Surface padding="md">
              <p className="text-label mb-3">Quick actions</p>
              <div className="space-y-1">
                {QUICK_LINKS.map(({ href, label, icon: Icon, ...rest }) => (
                  <Link
                    key={href}
                    href={href}
                    data-tour={'tour' in rest ? rest.tour : undefined}
                    className="flex items-center gap-3 px-2 py-2.5 -mx-2 rounded-xl text-body text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors group"
                  >
                    <Icon className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors" />
                    <span className="flex-1">{label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </Surface>

            {usage && (
              <Surface padding="md" data-tour="plan-usage">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-label mb-1">Your plan</p>
                    <p className="text-title font-semibold capitalize">{plan}</p>
                  </div>
                  {plan !== 'pro' && (
                    <Link href="/dashboard/upgrade">
                      <Button variant="outline" size="sm">
                        Upgrade
                      </Button>
                    </Link>
                  )}
                </div>
                <div className="space-y-3">
                  {USAGE_KEYS.map(({ key, label }) => {
                    const item = usage[key];
                    if (!item) return null;
                    const isUnlimited = item.limit === -1;
                    const pct = isUnlimited ? 0 : Math.min((item.current / item.limit) * 100, 100);
                    const isNearLimit = !isUnlimited && pct >= 80;
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between text-caption mb-1.5">
                          <span className="text-gray-600">{label}</span>
                          <span className={isNearLimit ? 'text-amber-600 font-medium' : 'text-gray-500'}>
                            {isUnlimited ? 'Unlimited' : `${item.current} / ${item.limit}`}
                          </span>
                        </div>
                        {!isUnlimited && (
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct >= 100 ? 'bg-red-500' : isNearLimit ? 'bg-amber-500' : 'bg-brand-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Surface>
            )}
          </div>
        </div>

        {/* Pick up where you left off */}
        <div>
          <div className="flex items-center justify-between mb-4">
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

          {projectsLoading && recentProjects.length === 0 ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-2xl bg-white shadow-sm animate-pulse" />
              ))}
            </div>
          ) : continueItem ? (
            <div className="space-y-2">
              {continueItem.type === 'project' ? (
                <Link href={`/dashboard/projects/${continueItem.item.id}`}>
                  <Surface padding="sm" hover className="flex items-center gap-4 group">
                    <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-gray-900 truncate">{continueItem.item.title}</p>
                      <p className="text-caption text-gray-500 capitalize">{continueItem.item.status.replace('_', ' ')}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors shrink-0" />
                  </Surface>
                </Link>
              ) : (
                <Link href={`/dashboard/transactions/${continueItem.item.id}`}>
                  <Surface padding="sm" hover className="flex items-center gap-4 group">
                    <div className="p-2.5 rounded-xl bg-gray-100 text-gray-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-gray-900 truncate">{continueItem.item.property_address}</p>
                      <p className="text-caption text-gray-500 capitalize">{continueItem.item.status.replace('_', ' ')}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors shrink-0" />
                  </Surface>
                </Link>
              )}

              {recentProjects
                .filter((p) => continueItem.type !== 'project' || p.id !== continueItem.item.id)
                .slice(0, 2)
                .map((project) => (
                  <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                    <Surface padding="sm" hover className="flex items-center gap-4 group">
                      <div className="p-2 rounded-lg bg-gray-100 text-gray-500">
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body text-gray-900 truncate">{project.title}</p>
                        <p className="text-caption text-gray-500 capitalize">{project.status.replace('_', ' ')}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors shrink-0" />
                    </Surface>
                  </Link>
                ))}
            </div>
          ) : (
            <Surface padding="lg" className="text-center">
              <FolderKanban className="w-8 h-8 mx-auto text-gray-300 mb-3" />
              <p className="text-body font-medium text-gray-900 mb-1">No recent work yet</p>
              <p className="text-caption text-gray-500 mb-4">Create a listing project to get started with AI content.</p>
              <Link href="/dashboard/projects/new" data-tour="new-project">
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New listing project
                </Button>
              </Link>
            </Surface>
          )}
        </div>
      </PageShell>
    </div>
  );
}

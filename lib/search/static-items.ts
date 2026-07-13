import type { SearchResult } from '@/lib/search/types';

export const STATIC_NAV_ITEMS: SearchResult[] = [
  { id: 'nav-dashboard', kind: 'nav', title: 'Dashboard', href: '/dashboard' },
  { id: 'nav-projects', kind: 'nav', title: 'Projects', href: '/dashboard/projects' },
  { id: 'nav-transactions', kind: 'nav', title: 'Transactions', href: '/dashboard/transactions' },
  { id: 'nav-clients', kind: 'nav', title: 'Clients', href: '/dashboard/clients' },
  { id: 'nav-leads', kind: 'nav', title: 'Leads', href: '/dashboard/leads' },
  { id: 'nav-research', kind: 'nav', title: 'Property Research', href: '/dashboard/property-research' },
  { id: 'nav-ads', kind: 'nav', title: 'Ads', href: '/dashboard/ads' },
  { id: 'nav-ads-performance', kind: 'nav', title: 'Ad performance', subtitle: 'Ads', href: '/dashboard/ads?tab=performance' },
  { id: 'nav-calendar', kind: 'nav', title: 'Calendar', href: '/dashboard/calendar' },
  { id: 'nav-ai', kind: 'nav', title: 'AI Assistant', href: '/dashboard/tasks' },
  { id: 'nav-account', kind: 'nav', title: 'Account settings', href: '/dashboard/account' },
];

export const STATIC_ACTION_ITEMS: SearchResult[] = [
  { id: 'action-new-project', kind: 'action', title: 'New listing project', href: '/dashboard/projects/new' },
  { id: 'action-new-transaction', kind: 'action', title: 'New transaction', href: '/dashboard/transactions/new' },
  { id: 'action-add-client', kind: 'action', title: 'Add a client', href: '/dashboard/clients' },
  { id: 'action-create-ad', kind: 'action', title: 'Create an ad', href: '/dashboard/ads' },
  { id: 'action-calendar-event', kind: 'action', title: 'Schedule calendar event', href: '/dashboard/calendar' },
  {
    id: 'action-ai-listing',
    kind: 'action',
    title: 'Ask AI: write a listing description',
    href: '/dashboard/tasks?prompt=Write%20a%20compelling%20listing%20description%20for%20a%203-bed%20home',
  },
  {
    id: 'action-ai-followup',
    kind: 'action',
    title: 'Ask AI: draft a client follow-up email',
    href: '/dashboard/tasks?prompt=Draft%20a%20follow-up%20email%20for%20a%20buyer%20who%20toured%20yesterday',
  },
];

export function filterStaticItems(items: SearchResult[], query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, 6);
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q),
  );
}

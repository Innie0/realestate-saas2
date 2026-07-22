import { mutate } from 'swr';
import { swrFetcher } from './swr';
import { fetchUpcomingItems } from '@/components/NotificationsPanel';

/** Shared SWR key for header bell + home Today panel (same fetcher). */
export const DASHBOARD_UPCOMING_KEY = 'dashboard-upcoming';

/** All primary sidebar destinations — warm route chunks + API cache after idle. */
export const DASHBOARD_NAV_ROUTES = [
  '/dashboard',
  '/dashboard/projects',
  '/dashboard/transactions',
  '/dashboard/clients',
  '/dashboard/leads',
  '/dashboard/property-research',
  '/dashboard/ads',
  '/dashboard/calendar',
  '/dashboard/tasks',
] as const;

/** API URLs to warm in SWR cache when hovering a sidebar link. */
const ROUTE_PREFETCH_APIS: Record<string, string[]> = {
  '/dashboard': [
    '/api/usage',
    '/api/projects?limit=3',
    '/api/clients?status=all',
    '/api/clients?status=all&view=inbox',
    '/api/transactions?status=open',
    '/api/transactions?limit=4',
    '/api/reminders?include_completed=false',
  ],
  '/dashboard/projects': ['/api/projects'],
  '/dashboard/transactions': ['/api/transactions?status=open', '/api/transactions'],
  '/dashboard/clients': ['/api/clients?status=all'],
  '/dashboard/leads': [
    '/api/clients?status=all&view=inbox',
    '/api/usage',
    '/api/agent-profile',
    '/api/agent-settings',
  ],
  '/dashboard/tasks': ['/api/conversations', '/api/usage'],
  '/dashboard/property-research': ['/api/usage'],
  '/dashboard/ads': ['/api/ads/connections', '/api/ads/promotions'],
  '/dashboard/calendar': ['/api/calendar/connections'],
  '/dashboard/account': [],
};

export function calendarEventsPrefetchUrl(date = new Date()): string {
  return `/api/calendar/events?month=${date.getMonth()}&year=${date.getFullYear()}`;
}

/** Prefetch Next.js route chunk + warm SWR cache for the target page's APIs. */
export function prefetchDashboardRoute(
  href: string,
  router?: { prefetch: (url: string) => void },
) {
  router?.prefetch(href);

  const apis = [...(ROUTE_PREFETCH_APIS[href] ?? [])];
  if (href === '/dashboard/calendar') {
    apis.push(calendarEventsPrefetchUrl());
  }

  for (const url of apis) {
    void mutate(url, swrFetcher(url), { revalidate: false }).catch(() => {
      /* best-effort prefetch */
    });
  }

  if (href === '/dashboard') {
    void mutate(DASHBOARD_UPCOMING_KEY, fetchUpcomingItems(), { revalidate: false }).catch(() => {
      /* best-effort prefetch */
    });
  }
}

/** Warm all dashboard routes after first paint (non-blocking). */
export function prefetchAllDashboardRoutes(router?: { prefetch: (url: string) => void }) {
  for (const href of DASHBOARD_NAV_ROUTES) {
    prefetchDashboardRoute(href, router);
  }
}

/** Schedule work after first paint so navigation stays responsive. */
export function scheduleIdleWork(work: () => void) {
  if (typeof window === 'undefined') return;
  const run = () => {
    try {
      work();
    } catch {
      /* best-effort */
    }
  };
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 2500 });
  } else {
    setTimeout(run, 400);
  }
}

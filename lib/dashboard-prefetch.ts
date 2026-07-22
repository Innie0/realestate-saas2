import { mutate } from 'swr';
import { swrFetcher } from './swr';

/** Shared SWR key for header bell + home Today panel (same fetcher). */
export const DASHBOARD_UPCOMING_KEY = 'dashboard-upcoming';

/** API URLs to warm on sidebar hover only — keep lists short to avoid network storms. */
const ROUTE_PREFETCH_APIS: Record<string, string[]> = {
  '/dashboard': [
    '/api/usage',
    '/api/projects?limit=3',
    '/api/clients?status=all',
    '/api/transactions?status=open',
  ],
  '/dashboard/projects': ['/api/projects'],
  '/dashboard/transactions': ['/api/transactions?status=open'],
  '/dashboard/clients': ['/api/clients?status=all'],
  '/dashboard/leads': ['/api/clients?status=all&view=inbox'],
  '/dashboard/tasks': ['/api/conversations'],
  '/dashboard/property-research': ['/api/usage'],
  '/dashboard/ads': ['/api/ads/connections'],
  '/dashboard/calendar': ['/api/calendar/connections'],
};

export function calendarEventsPrefetchUrl(date = new Date()): string {
  return `/api/calendar/events?month=${date.getMonth()}&year=${date.getFullYear()}`;
}

let prefetchInFlight = 0;
const MAX_CONCURRENT_PREFETCH = 2;

/** Prefetch route chunk + at most a few APIs when hovering a sidebar link. */
export function prefetchDashboardRoute(
  href: string,
  router?: { prefetch: (url: string) => void },
) {
  router?.prefetch(href);

  const apis = [...(ROUTE_PREFETCH_APIS[href] ?? [])].slice(0, 3);
  if (href === '/dashboard/calendar') {
    apis.push(calendarEventsPrefetchUrl());
  }

  for (const url of apis) {
    if (prefetchInFlight >= MAX_CONCURRENT_PREFETCH) break;
    prefetchInFlight += 1;
    void mutate(url, swrFetcher(url), { revalidate: false })
      .catch(() => {
        /* best-effort prefetch */
      })
      .finally(() => {
        prefetchInFlight = Math.max(0, prefetchInFlight - 1);
      });
  }
}

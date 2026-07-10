import { mutate } from 'swr';
import { swrFetcher } from './swr';

/** API URLs to warm in SWR cache when hovering a sidebar link. */
const ROUTE_PREFETCH_APIS: Record<string, string[]> = {
  '/dashboard': [
    '/api/usage',
    '/api/projects?limit=3',
    '/api/clients?status=all',
    '/api/transactions?limit=4',
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
  '/dashboard/tasks': ['/api/conversations'],
  '/dashboard/property-research': ['/api/usage'],
  '/dashboard/ads': ['/api/ads/connections', '/api/ads/campaigns?platform=all'],
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
}

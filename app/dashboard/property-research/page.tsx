'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardPage from '@/components/layout/DashboardPage';
import { PropertyResearchPageLoading } from '@/components/dashboard/page-loading';
import PropertyResearchCommandBar, {
  type ResearchSearchMode,
} from '@/components/property-research/PropertyResearchCommandBar';
import { SITE_NAME } from '@/lib/site-config';
import { useApi } from '@/lib/swr';
import { useTour } from '@/hooks/useTour';
import {
  readPropertyResearchHistory,
  type PropertyResearchHistoryEntry,
} from '@/lib/property-research-history';
import {
  cmaPropertyHref,
  subjectPropertyHref,
} from '@/lib/property-research-routes';
import { US_STATES } from '@/lib/property-research-states';

function PropertyResearchLandingContent() {
  const router = useRouter();
  const [history, setHistory] = useState<PropertyResearchHistoryEntry[]>([]);
  const [lookupUsage, setLookupUsage] = useState<{ current: number; limit: number } | null>(null);
  const [cmaUsage, setCmaUsage] = useState<{ current: number; limit: number } | null>(null);
  const [searchMode, setSearchMode] = useState<ResearchSearchMode>('research');

  const { response: usageResponse } = useApi('/api/usage');

  useTour({
    tourKey: 'tour_property_research',
    ready: true,
    steps: [
      {
        element: '[data-tour="research-search"]',
        popover: {
          title: 'Research an address',
          description:
            'Choose Owner & details for owner and property info, or Run CMA for comp-based market analysis.',
          side: 'bottom',
        },
      },
    ],
  });

  useEffect(() => {
    document.title = `Property Research - ${SITE_NAME}`;
  }, []);

  useEffect(() => {
    setHistory(readPropertyResearchHistory());
  }, []);

  useEffect(() => {
    const data = usageResponse?.data as Record<string, { current: number; limit: number }> | undefined;
    if (!data) return;
    if (data.property_lookups) setLookupUsage(data.property_lookups);
    if (data.market_analyses) setCmaUsage(data.market_analyses);
  }, [usageResponse]);

  const handleCommandBarSubmit = useCallback(
    (fields: { street: string; city: string; state: string; zip: string }, mode: ResearchSearchMode) => {
      const href =
        mode === 'cma'
          ? cmaPropertyHref(fields)
          : subjectPropertyHref(fields, { auto: true });
      router.push(href);
    },
    [router],
  );

  const handleHistorySelect = useCallback(
    (entry: PropertyResearchHistoryEntry) => {
      router.push(
        subjectPropertyHref(
          {
            street: entry.street,
            city: entry.city,
            state: entry.state,
            zip: entry.zip,
          },
          { auto: true },
        ),
      );
    },
    [router],
  );

  return (
    <DashboardPage
      title="Property Research"
      subtitle="Look up owners, property details, and run comp-based CMA"
    >
      <PropertyResearchCommandBar
        mode={searchMode}
        onModeChange={setSearchMode}
        onSubmit={handleCommandBarSubmit}
        history={history}
        onHistorySelect={handleHistorySelect}
        states={US_STATES}
        lookupUsage={lookupUsage}
        cmaUsage={cmaUsage}
      />
    </DashboardPage>
  );
}

export default function PropertyResearchPage() {
  return (
    <Suspense fallback={<PropertyResearchPageLoading />}>
      <PropertyResearchLandingContent />
    </Suspense>
  );
}

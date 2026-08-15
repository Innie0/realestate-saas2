'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, User } from 'lucide-react';
import DashboardPage from '@/components/layout/DashboardPage';
import DetailPageTabNav from '@/components/layout/DetailPageTabNav';
import { Card } from '@/components/ui/Card';
import { PropertyResearchPageLoading } from '@/components/dashboard/page-loading';
import AnimatedTabPanels from '@/components/motion/AnimatedTabPanels';
import PropertyResearchAddressBar from '@/components/property-research/PropertyResearchAddressBar';
import { PropertyOverviewCard } from '@/components/property-research/PropertyOverviewCard';
import { OwnerContactPanel, type LookupResponse } from '@/components/property-research/OwnerContactPanel';
import type { CmaAnalysisResult } from '@/components/property-research/CmaPanel';
import { SITE_NAME } from '@/lib/site-config';
import { appendPropertyResearchHistory } from '@/lib/property-research-history';
import {
  formatAddressLabel,
  parsePropertyAddressFromSearchParams,
  propertyResearchLandingHref,
} from '@/lib/property-research-routes';
import { normalizeAddressKey } from '@/lib/property-research-cache';
import {
  findLatestCmaCache,
  getLocalResearchCache,
  lookupLocalCacheKey,
} from '@/lib/research-local-cache';
import { normalizeCmaResult } from '@/lib/cma-result-format';

type SubjectTabId = 'overview' | 'owner';

const SUBJECT_TABS = [
  { id: 'overview' as const, label: 'Overview', icon: LayoutGrid },
  { id: 'owner' as const, label: 'Owner & Contact', icon: User },
];

function SubjectPropertyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fields = useMemo(
    () => parsePropertyAddressFromSearchParams(searchParams),
    [searchParams],
  );

  const [activeTab, setActiveTab] = useState<SubjectTabId>('overview');
  const [lookupTrigger, setLookupTrigger] = useState(0);
  const [lookupData, setLookupData] = useState<LookupResponse | null>(null);
  const [cmaResult, setCmaResult] = useState<CmaAnalysisResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const autoRan = useRef(false);

  useEffect(() => {
    if (!fields) {
      router.replace(propertyResearchLandingHref());
      return;
    }

    document.title = `Owner & details - ${SITE_NAME}`;

    const addressKey = normalizeAddressKey(fields);
    const cachedLookup = getLocalResearchCache<LookupResponse>(lookupLocalCacheKey(addressKey));
    const cachedCma = findLatestCmaCache<CmaAnalysisResult>(addressKey);
    setLookupData(cachedLookup?.found ? cachedLookup : null);
    setCmaResult(cachedCma ? normalizeCmaResult(cachedCma) : null);

    if (searchParams.get('auto') === '1' && !autoRan.current) {
      autoRan.current = true;
      setLookupTrigger((n) => n + 1);
    }
  }, [fields, router, searchParams]);

  const forceLookupRefresh = searchParams.get('auto') === '1' || !lookupData?.found;

  const addressLabel = fields ? formatAddressLabel(fields) : '';

  const saveToHistory = useCallback(() => {
    if (!fields) return;
    appendPropertyResearchHistory(fields);
  }, [fields]);

  const handleLookupComplete = useCallback(
    (data: LookupResponse | null) => {
      setLookupData(data);
      if (data?.found) saveToHistory();
    },
    [saveToHistory],
  );

  if (!fields) {
    return null;
  }

  const firstPerson = lookupData?.found && lookupData.results?.[0] ? lookupData.results[0] : null;
  const lookupFinished = lookupData !== null && !lookupLoading;
  const overviewLoading = lookupLoading || (lookupTrigger > 0 && lookupData === null);

  return (
    <DashboardPage
      title="Owner & details"
      subtitle="Property details and owner contact records"
      size="full"
    >
      <div className="space-y-4">
        <PropertyResearchAddressBar
          fields={fields}
          label={addressLabel}
        />

        <Card className="overflow-hidden p-0">
          <DetailPageTabNav
            tabs={SUBJECT_TABS.map((tab) => ({ id: tab.id, label: tab.label, icon: tab.icon }))}
            activeTab={activeTab}
            onChange={setActiveTab}
            className="px-4 sm:px-5"
          />
          <AnimatedTabPanels
            activeTab={activeTab}
            panels={[
              {
                id: 'overview',
                content: (
                  <PropertyOverviewCard
                    addressLabel={addressLabel}
                    person={firstPerson}
                    cmaResult={cmaResult}
                    loading={overviewLoading}
                    notFoundMessage={
                      lookupFinished && !firstPerson ? lookupData?.message ?? null : null
                    }
                  />
                ),
              },
              {
                id: 'owner',
                content: (
                  <div className="p-5 sm:p-[22px]">
                    <OwnerContactPanel
                      street={fields.street}
                      city={fields.city}
                      state={fields.state}
                      zip={fields.zip}
                      lookupTrigger={lookupTrigger}
                      forceRefreshOnTrigger={forceLookupRefresh}
                      initialData={lookupData}
                      onComplete={handleLookupComplete}
                      onLoadingChange={setLookupLoading}
                    />
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </DashboardPage>
  );
}

export default function SubjectPropertyPage() {
  return (
    <Suspense fallback={<PropertyResearchPageLoading />}>
      <SubjectPropertyContent />
    </Suspense>
  );
}

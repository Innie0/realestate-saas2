'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardPage from '@/components/layout/DashboardPage';
import { PropertyResearchPageLoading } from '@/components/dashboard/page-loading';
import { CmaPanel, type CmaAnalysisResult } from '@/components/property-research/CmaPanel';
import type { LookupResponse } from '@/components/property-research/OwnerContactPanel';
import { SITE_NAME } from '@/lib/site-config';
import { appendPropertyResearchHistory } from '@/lib/property-research-history';
import {
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

function CmaPropertyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fields = useMemo(
    () => parsePropertyAddressFromSearchParams(searchParams),
    [searchParams],
  );

  const [cmaTrigger, setCmaTrigger] = useState(0);
  const [lookupData, setLookupData] = useState<LookupResponse | null>(null);
  const [cmaResult, setCmaResult] = useState<CmaAnalysisResult | null>(null);
  const autoRan = useRef(false);

  useEffect(() => {
    if (!fields) {
      router.replace(propertyResearchLandingHref());
      return;
    }

    document.title = `Market analysis - ${SITE_NAME}`;

    const addressKey = normalizeAddressKey(fields);
    const cachedLookup = getLocalResearchCache<LookupResponse>(lookupLocalCacheKey(addressKey));
    const cachedCma = findLatestCmaCache<CmaAnalysisResult>(addressKey);
    setLookupData(cachedLookup);
    setCmaResult(cachedCma ? normalizeCmaResult(cachedCma) : null);

    if (searchParams.get('auto') === '1' && !autoRan.current) {
      autoRan.current = true;
      setCmaTrigger((n) => n + 1);
    }
  }, [fields, router, searchParams]);

  const saveToHistory = useCallback(() => {
    if (!fields) return;
    appendPropertyResearchHistory(fields);
  }, [fields]);

  const handleCmaComplete = useCallback(
    (data: CmaAnalysisResult | null) => {
      setCmaResult(data);
      if (data) saveToHistory();
    },
    [saveToHistory],
  );

  if (!fields) {
    return null;
  }

  return (
    <DashboardPage
      title="Market analysis"
      size="full"
      fillViewport
      className="!py-0 sm:!py-0"
    >
      <CmaPanel
        street={fields.street}
        city={fields.city}
        state={fields.state}
        zip={fields.zip}
        lookupData={lookupData}
        runTrigger={cmaTrigger}
        initialResult={cmaResult}
        onComplete={handleCmaComplete}
      />
    </DashboardPage>
  );
}

export default function CmaPropertyPage() {
  return (
    <Suspense fallback={<PropertyResearchPageLoading />}>
      <CmaPropertyContent />
    </Suspense>
  );
}

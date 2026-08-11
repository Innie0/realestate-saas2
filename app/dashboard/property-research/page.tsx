'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardPage from '@/components/layout/DashboardPage';
import DetailPageTabNav from '@/components/layout/DetailPageTabNav';
import { Card } from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import DataLoadingState from '@/components/dashboard/DataLoadingState';
import { PropertyResearchPageLoading } from '@/components/dashboard/page-loading';
import PanelHeader from '@/components/ui/PanelHeader';
import AnimatedTabPanels from '@/components/motion/AnimatedTabPanels';
import PropertyResearchSearchCard from '@/components/property-research/PropertyResearchSearchCard';
import PropertyResearchTips from '@/components/property-research/PropertyResearchTips';
import { SITE_NAME } from '@/lib/site-config';
import { useApi } from '@/lib/swr';
import { useTour } from '@/hooks/useTour';
import { CmaPanel, type CmaAnalysisResult } from '@/components/property-research/CmaPanel';
import { OwnerContactPanel, type LookupResponse } from '@/components/property-research/OwnerContactPanel';
import { PropertyOverviewCard } from '@/components/property-research/PropertyOverviewCard';
import { normalizeAddressKey } from '@/lib/property-research-cache';
import { parseAddressQuery } from '@/lib/search/parse-address';
import {
  findLatestCmaCache,
  getLocalResearchCache,
  lookupLocalCacheKey,
} from '@/lib/research-local-cache';
import { normalizeCmaResult } from '@/lib/cma-result-format';
import { History, Trash2, Pencil, User, BarChart2, LayoutGrid } from 'lucide-react';

type TabId = 'overview' | 'owner' | 'cma';

const HISTORY_KEY = 'oikaro_property_research_history';
const MAX_HISTORY = 10;

interface HistoryEntry {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  lookedUpAt: string;
}

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' }, { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' }, { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' }, { value: 'DC', label: 'Washington DC' },
];

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'owner', label: 'Owner & Contact', icon: User },
  { id: 'cma', label: 'Market / CMA', icon: BarChart2 },
];

function PropertyResearchContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabId) || 'overview';

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>(
    ['overview', 'owner', 'cma'].includes(initialTab) ? initialTab : 'overview',
  );
  const [lookupTrigger, setLookupTrigger] = useState(0);
  const [cmaTrigger, setCmaTrigger] = useState(0);
  const [lookupData, setLookupData] = useState<LookupResponse | null>(null);
  const [cmaResult, setCmaResult] = useState<CmaAnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lookupUsage, setLookupUsage] = useState<{ current: number; limit: number } | null>(null);
  const [cmaUsage, setCmaUsage] = useState<{ current: number; limit: number } | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [researchSearched, setResearchSearched] = useState(false);

  const { response: usageResponse, mutate: mutateUsage } = useApi('/api/usage');

  useTour({
    tourKey: 'tour_property_research',
    ready: !researchSearched,
    steps: [
      {
        element: '[data-tour="research-search"]',
        popover: {
          title: 'Research an address',
          description: 'Enter a street and state to pull owner contact info, property details, and comp-based CMA data.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="research-history"]',
        popover: {
          title: 'Recent lookups',
          description: 'Previously searched addresses appear here. Click one to reload cached results without using another lookup.',
          side: 'right',
        },
      },
      {
        element: '[data-tour="research-tabs"]',
        popover: {
          title: 'Overview, owner, and CMA',
          description: 'After a search, switch between property overview, owner contact records, and market analysis tabs.',
          side: 'top',
        },
      },
    ],
  });

  useEffect(() => {
    document.title = `Property Research - ${SITE_NAME}`;
  }, []);

  useEffect(() => {
    const streetParam = searchParams.get('street');
    const qParam = searchParams.get('q');
    const auto = searchParams.get('auto') === '1';

    let nextStreet = streetParam ?? '';
    let nextCity = searchParams.get('city') ?? '';
    let nextState = searchParams.get('state') ?? '';
    let nextZip = searchParams.get('zip') ?? '';

    if (!streetParam && qParam) {
      const parsed = parseAddressQuery(qParam);
      if (parsed) {
        nextStreet = parsed.street;
        nextCity = parsed.city;
        nextState = parsed.state;
        nextZip = parsed.zip;
      } else {
        nextStreet = qParam;
      }
    }

    if (!nextStreet.trim()) return;

    setStreet(nextStreet);
    setCity(nextCity);
    setState(nextState);
    setZip(nextZip);

    if (auto && nextState) {
      setResearchSearched(true);
      setActiveTab('overview');
      setLookupTrigger((n) => n + 1);
    }
  }, [searchParams]);

  useEffect(() => {
    void mutateUsage();
  }, [lookupTrigger, cmaTrigger, mutateUsage]);

  useEffect(() => {
    const data = usageResponse?.data as Record<string, { current: number; limit: number }> | undefined;
    if (!data) return;
    if (data.property_lookups) setLookupUsage(data.property_lookups);
    if (data.market_analyses) setCmaUsage(data.market_analyses);
  }, [usageResponse]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);

  const addressLabel = [street, city, state, zip].filter(Boolean).join(', ');

  const saveToHistory = useCallback(() => {
    if (!street.trim()) return;
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      label: addressLabel,
      street: street.trim(),
      city: city.trim(),
      state,
      zip: zip.trim(),
      lookedUpAt: new Date().toISOString(),
    };
    setHistory((prev) => {
      const deduped = prev.filter((h) => h.label.toLowerCase() !== entry.label.toLowerCase());
      const updated = [entry, ...deduped].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [street, city, state, zip, addressLabel]);

  const handleLookupComplete = useCallback(
    (data: LookupResponse | null) => {
      setLookupData(data);
      if (data?.found) saveToHistory();
    },
    [saveToHistory],
  );

  const handleCmaComplete = useCallback(
    (data: CmaAnalysisResult | null) => {
      setCmaResult(data);
      if (data) saveToHistory();
    },
    [saveToHistory],
  );

  const fillDemoAddress = () => {
    setStreet('123 W Main Street');
    setCity('Austin');
    setState('TX');
    setZip('78701');
  };

  const handleLookUp = () => {
    if (!street.trim() || !state) return;
    setActiveTab('owner');
    setResearchSearched(true);
    setLookupTrigger((n) => n + 1);
  };

  const handleResearchAddress = () => {
    if (!street.trim() || !state) return;
    setActiveTab('overview');
    setResearchSearched(true);
    setLookupTrigger((n) => n + 1);
  };

  const handleRunCma = () => {
    if (!street.trim() || !state) return;
    setActiveTab('cma');
    setResearchSearched(true);
    setCmaTrigger((n) => n + 1);
  };

  const loadHistory = (entry: HistoryEntry) => {
    setStreet(entry.street);
    setCity(entry.city);
    setState(entry.state);
    setZip(entry.zip);
    setActiveTab('overview');
    setResearchSearched(true);

    const addressKey = normalizeAddressKey({
      street: entry.street,
      city: entry.city,
      state: entry.state,
      zip: entry.zip,
    });
    const cachedLookup = getLocalResearchCache<LookupResponse>(lookupLocalCacheKey(addressKey));
    const cachedCma = findLatestCmaCache<CmaAnalysisResult>(addressKey);
    setLookupData(cachedLookup);
    setCmaResult(cachedCma ? normalizeCmaResult(cachedCma) : null);
    if (cachedLookup) setLookupTrigger((n) => n + 1);
    if (cachedCma) setCmaTrigger((n) => n + 1);
  };

  const handleSearchAnother = () => {
    setResearchSearched(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const firstPerson = lookupData?.found && lookupData.results?.[0] ? lookupData.results[0] : null;

  const formatUsage = (usage: { current: number; limit: number } | null) => {
    if (!usage) return '—';
    if (usage.limit === -1) return '∞';
    return `${usage.current}/${usage.limit}`;
  };

  const usageMeta =
    lookupUsage || cmaUsage
      ? `Lookups ${formatUsage(lookupUsage)} · CMA ${formatUsage(cmaUsage)} this month`
      : undefined;

  return (
    <DashboardPage
      title="Property Research"
      subtitle={usageMeta ?? 'Look up owners, property details, and run comp-based CMA'}
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-4">
            <p className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
              Usage this month
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-muted-foreground">Lookups</span>
                <span className="text-[13px] font-medium text-foreground">{formatUsage(lookupUsage)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-muted-foreground">CMA runs</span>
                <span className="text-[13px] font-medium text-foreground">{formatUsage(cmaUsage)}</span>
              </div>
            </div>
            <p className="mt-3 border-t border-border pt-3 text-[11.5px] leading-relaxed text-muted-foreground">
              Counts new API lookups only. Demo searches and cached reloads are free and do not increase this total.
            </p>
          </Card>

          <Card data-tour="research-history" className="overflow-hidden p-0">
            <PanelHeader
              title="Recent searches"
              meta={history.length > 0 ? `${history.length} saved` : undefined}
              action={
                history.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-rose-600"
                  >
                    <Trash2 className="size-3.5" /> Clear
                  </button>
                ) : undefined
              }
            />
            {history.length === 0 ? (
              <EmptyState
                icon={History}
                title="No recent searches"
                description="Successful searches appear here so you can reload cached results without using another lookup."
                className="py-8"
              />
            ) : (
              <div className="max-h-72 divide-y divide-border overflow-y-auto">
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => loadHistory(entry)}
                    className="w-full px-4 py-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <p className="break-words text-[13px] font-medium text-foreground">{entry.label}</p>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                      {new Date(entry.lookedUpAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </aside>

        <div className="min-w-0 space-y-4">
          {!researchSearched ? (
            <>
              <PropertyResearchSearchCard
                street={street}
                city={city}
                state={state}
                zip={zip}
                states={US_STATES}
                loading={lookupLoading}
                onStreetChange={setStreet}
                onCityChange={setCity}
                onStateChange={setState}
                onZipChange={setZip}
                onSubmit={handleResearchAddress}
                onTryDemo={fillDemoAddress}
              />
              <PropertyResearchTips />
            </>
          ) : (
            <>
              {addressLabel ? (
                <div className="flex flex-col gap-3 rounded-[10px] border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="mb-0.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                      Current property
                    </p>
                    <p className="break-words text-[15px] font-semibold text-foreground">{addressLabel}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSearchAnother}
                    className="inline-flex shrink-0 items-center gap-1.5 self-start text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:self-auto"
                  >
                    <Pencil className="size-3.5" />
                    Search another
                  </button>
                </div>
              ) : null}

              {lookupLoading && activeTab !== 'owner' ? (
                <Card>
                  <DataLoadingState
                    title="Researching this address"
                    description="Fetching county records and owner contact data. First lookup usually takes 5–10 seconds."
                    className="py-10"
                  />
                </Card>
              ) : null}

              <Card className="overflow-hidden p-0" data-tour="research-tabs">
                <DetailPageTabNav
                  tabs={TABS.map((tab) => ({ id: tab.id, label: tab.label, icon: tab.icon }))}
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
                          addressLabel={addressLabel || 'No address entered'}
                          person={firstPerson}
                          cmaResult={cmaResult}
                          hasLookup={!!firstPerson}
                          onLookUpOwner={() => {
                            setActiveTab('owner');
                            if (!firstPerson) handleLookUp();
                          }}
                          onRunCma={() => {
                            setActiveTab('cma');
                            if (!cmaResult) handleRunCma();
                          }}
                        />
                      ),
                    },
                    {
                      id: 'owner',
                      content: (
                        <div className="p-5 sm:p-[22px]">
                          <OwnerContactPanel
                            street={street}
                            city={city}
                            state={state}
                            zip={zip}
                            lookupTrigger={lookupTrigger}
                            initialData={lookupData}
                            onComplete={handleLookupComplete}
                            onLoadingChange={setLookupLoading}
                          />
                        </div>
                      ),
                    },
                    {
                      id: 'cma',
                      content: (
                        <div className="p-5 sm:p-[22px]">
                          <CmaPanel
                            street={street}
                            city={city}
                            state={state}
                            zip={zip}
                            lookupData={lookupData}
                            runTrigger={cmaTrigger}
                            initialResult={cmaResult}
                            onComplete={handleCmaComplete}
                          />
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>
            </>
          )}
        </div>
      </div>
    </DashboardPage>
  );
}

export default function PropertyResearchPage() {
  return (
    <Suspense fallback={<PropertyResearchPageLoading />}>
      <PropertyResearchContent />
    </Suspense>
  );
}

'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardPage from '@/components/layout/DashboardPage';
import Surface from '@/components/ui/Surface';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import AnimatedTabPanels from '@/components/motion/AnimatedTabPanels';
import { useApi } from '@/lib/swr';
import { useTour } from '@/hooks/useTour';
import { CmaPanel, type CmaAnalysisResult } from '@/components/property-research/CmaPanel';
import { OwnerContactPanel, type LookupResponse } from '@/components/property-research/OwnerContactPanel';
import { PropertyOverviewCard } from '@/components/property-research/PropertyOverviewCard';
import { normalizeAddressKey } from '@/lib/property-research-cache';
import {
  findLatestCmaCache,
  getLocalResearchCache,
  lookupLocalCacheKey,
} from '@/lib/research-local-cache';
import {
  Search, MapPin, Loader2, History, Trash2, X,
  User, BarChart2, LayoutGrid, Pencil,
} from 'lucide-react';
import clsx from 'clsx';

type TabId = 'overview' | 'owner' | 'cma';

const HISTORY_KEY = 'realestic_property_research_history';
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
    ['overview', 'owner', 'cma'].includes(initialTab) ? initialTab : 'overview'
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
    document.title = 'Property Research - Realestic';
  }, []);

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

  const handleLookupComplete = useCallback((data: LookupResponse | null) => {
    setLookupData(data);
  }, []);

  const handleCmaComplete = useCallback((data: CmaAnalysisResult | null) => {
    setCmaResult(data);
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
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, [street, city, state, zip, addressLabel]);

  const handleLookUp = () => {
    if (!street.trim() || !state) return;
    saveToHistory();
    setActiveTab('owner');
    setResearchSearched(true);
    setLookupTrigger((n) => n + 1);
  };

  const handleResearchAddress = () => {
    if (!street.trim() || !state) return;
    saveToHistory();
    setActiveTab('overview');
    setResearchSearched(true);
    setLookupTrigger((n) => n + 1);
  };

  const handleRunCma = () => {
    if (!street.trim() || !state) return;
    saveToHistory();
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
    setCmaResult(cachedCma);
    if (cachedLookup) setLookupTrigger((n) => n + 1);
    if (cachedCma) setCmaTrigger((n) => n + 1);
  };

  const clearForm = () => {
    setStreet('');
    setCity('');
    setState('');
    setZip('');
    setLookupData(null);
    setCmaResult(null);
    setResearchSearched(false);
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
      size="default"
      inline
    >
      {/* Search form — only shown before a search has been run */}
      {!researchSearched && (
        <Surface flat padding="none" className="p-5 sm:p-6" data-tour="research-search">
          <div className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-medium text-gray-600 mb-1.5">Street address *</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-450" />
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. 123 W Main Street"
                  className="w-full pl-10 pr-4 py-2.5 rounded-[10px] border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-450 focus:outline-none focus:border-gray-400 text-[14px]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[12.5px] font-medium text-gray-600 mb-1.5">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Austin"
                  className="w-full px-3 py-2.5 rounded-[10px] border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-450 focus:outline-none focus:border-gray-400 text-[13px]"
                />
              </div>
              <div>
                <Select
                  label="State *"
                  value={state}
                  onChange={setState}
                  placeholder="Select state"
                  triggerClassName="w-full bg-gray-50 border-gray-200"
                  options={[
                    { value: '', label: 'Select state' },
                    ...US_STATES.map((s) => ({ value: s.value, label: s.label })),
                  ]}
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-medium text-gray-600 mb-1.5">ZIP</label>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="93291"
                  className="w-full px-3 py-2.5 rounded-[10px] border border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-450 focus:outline-none focus:border-gray-400 text-[13px]"
                />
              </div>
            </div>
            <p className="text-[12px] text-gray-450">
              Demo: 123 W Main Street, Austin, TX — sample owner + CMA (no real PII).
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={handleResearchAddress}
                disabled={!street.trim() || !state || lookupLoading}
                className="inline-flex items-center gap-2"
              >
                {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {lookupLoading ? 'Researching…' : 'Research address'}
              </Button>
              {(street || city || state || zip) && (
                <button
                  type="button"
                  onClick={clearForm}
                  className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-gray-450 hover:text-gray-900 transition-colors"
                >
                  <X className="w-4 h-4" /> Clear
                </button>
              )}
            </div>
          </div>
        </Surface>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-5">
        {/* Context rail */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Surface flat padding="none" className="p-4">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-gray-450 mb-3">Usage this month</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-gray-450">Lookups</span>
                <span className="text-[13px] font-medium text-gray-900">{formatUsage(lookupUsage)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-gray-450">CMA runs</span>
                <span className="text-[13px] font-medium text-gray-900">{formatUsage(cmaUsage)}</span>
              </div>
            </div>
          </Surface>

          <Surface flat padding="none" className="overflow-hidden" data-tour="research-history">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-150">
              <span className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-gray-450">
                <History className="w-3.5 h-3.5" />
                Recent
              </span>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="text-[12px] text-gray-450 hover:text-rose-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="px-4 py-6 text-[12.5px] text-gray-450 text-center">Searched addresses appear here</p>
            ) : (
              <div className="divide-y divide-gray-150 max-h-64 overflow-y-auto">
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => loadHistory(entry)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-[13px] text-gray-900 truncate">{entry.label}</p>
                    <p className="text-[11.5px] text-gray-450 mt-0.5">
                      {new Date(entry.lookedUpAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </Surface>
        </aside>

        {/* Results canvas */}
        <div className="space-y-4 min-w-0">
          {lookupLoading && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 rounded-[10px] border border-gray-200 bg-gray-50 px-4 py-3 text-[13px] text-gray-700"
            >
              <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">Researching this address…</p>
                <p className="text-gray-450 mt-0.5">
                  Fetching county records and owner contact data. First lookup usually takes 5–10
                  seconds; repeat searches of the same address are much faster.
                </p>
              </div>
            </motion.div>
          )}

          {researchSearched && addressLabel && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between gap-3 rounded-[10px] border border-gray-200 bg-white px-4 py-3"
            >
              <div>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-gray-450 mb-0.5">Current property</p>
                <p className="text-[15px] font-semibold text-gray-900 truncate">{addressLabel}</p>
              </div>
              <button
                type="button"
                onClick={handleSearchAnother}
                className="shrink-0 flex items-center gap-1.5 text-[12.5px] font-medium text-gray-450 hover:text-gray-900 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Search another
              </button>
            </motion.div>
          )}

          {/* Tab bar + panel share one bordered card (square join per handoff) */}
          <div className="rounded-[10px] border border-gray-200 bg-white overflow-hidden" data-tour="research-tabs">
            <div
              className="flex items-stretch gap-1 bg-gray-100 p-1 border-b border-gray-150"
              role="tablist"
            >
              {TABS.map(({ id, label, icon: Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(id)}
                    className={clsx(
                      'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-colors',
                      isActive ? 'bg-brand-500 text-white' : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.9} />
                    {label}
                  </button>
                );
              })}
            </div>

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
                    <div className="p-5 sm:p-6">
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
                    <div className="p-5 sm:p-6">
                      <CmaPanel
                        street={street}
                        city={city}
                        state={state}
                        zip={zip}
                        runTrigger={cmaTrigger}
                        initialResult={cmaResult}
                        onComplete={handleCmaComplete}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>
    </DashboardPage>
  );
}

export default function PropertyResearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      }
    >
      <PropertyResearchContent />
    </Suspense>
  );
}

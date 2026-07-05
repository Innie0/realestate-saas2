'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import DashboardPage from '@/components/layout/DashboardPage';
import Tabs from '@/components/ui/Tabs';
import Surface from '@/components/ui/Surface';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import AnimatedTabPanels from '@/components/motion/AnimatedTabPanels';
import { useApi } from '@/lib/swr';
import { CmaPanel, type CmaAnalysisResult } from '@/components/property-research/CmaPanel';
import { OwnerContactPanel, type LookupResponse } from '@/components/property-research/OwnerContactPanel';
import { PropertyOverviewCard } from '@/components/property-research/PropertyOverviewCard';
import { normalizeAddressKey } from '@/lib/property-research-cache';
import {
  cmaLocalCacheKey,
  getLocalResearchCache,
  lookupLocalCacheKey,
} from '@/lib/research-local-cache';
import {
  Search, MapPin, Loader2, History, Trash2, X,
  User, BarChart2, LayoutGrid,
} from 'lucide-react';

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

  const { response: usageResponse, mutate: mutateUsage } = useApi('/api/usage');

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
    setLookupTrigger((n) => n + 1);
  };

  const handleResearchAddress = () => {
    if (!street.trim() || !state) return;
    saveToHistory();
    setActiveTab('overview');
    setLookupTrigger((n) => n + 1);
  };

  const handleRunCma = () => {
    if (!street.trim() || !state) return;
    saveToHistory();
    setActiveTab('cma');
    setCmaTrigger((n) => n + 1);
  };

  const loadHistory = (entry: HistoryEntry) => {
    setStreet(entry.street);
    setCity(entry.city);
    setState(entry.state);
    setZip(entry.zip);
    setActiveTab('overview');

    const addressKey = normalizeAddressKey({
      street: entry.street,
      city: entry.city,
      state: entry.state,
      zip: entry.zip,
    });
    const cachedLookup = getLocalResearchCache<LookupResponse>(lookupLocalCacheKey(addressKey));
    const cachedCma = getLocalResearchCache<CmaAnalysisResult>(
      cmaLocalCacheKey(addressKey, { radius: 0.5, yearsBack: 1 })
    );
    setLookupData(cachedLookup);
    setCmaResult(cachedCma);
  };

  const clearForm = () => {
    setStreet('');
    setCity('');
    setState('');
    setZip('');
    setLookupData(null);
    setCmaResult(null);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const firstPerson = lookupData?.found && lookupData.results?.[0] ? lookupData.results[0] : null;
  const hasResults = Boolean(firstPerson || cmaResult);

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
      ambient="tool"
    >
      {/* Hero search */}
      <Surface padding="lg" className="border-brand-100/60">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Street address *</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-500/70" />
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="e.g. 123 W Main Street"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/25 text-[15px]"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Austin"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              />
            </div>
            <div>
              <Select
                label="State *"
                value={state}
                onChange={setState}
                placeholder="Select state"
                triggerClassName="w-full bg-gray-50"
                options={[
                  { value: '', label: 'Select state' },
                  ...US_STATES.map((s) => ({ value: s.value, label: s.label })),
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ZIP</label>
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="93291"
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
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
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
        </div>
      </Surface>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-5">
        {/* Context rail */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Surface padding="sm">
            <p className="text-label mb-3">Usage this month</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Lookups</span>
                <span className="font-medium text-gray-900">{formatUsage(lookupUsage)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">CMA runs</span>
                <span className="font-medium text-gray-900">{formatUsage(cmaUsage)}</span>
              </div>
            </div>
          </Surface>

          <Surface padding="none" className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <History className="w-3.5 h-3.5" />
                Recent
              </span>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={clearHistory}
                  className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="px-4 py-6 text-xs text-gray-400 text-center">Searched addresses appear here</p>
            ) : (
              <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => loadHistory(entry)}
                    className="w-full text-left px-4 py-3 hover:bg-brand-50/50 transition-colors"
                  >
                    <p className="text-sm text-gray-900 truncate">{entry.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
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
              className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900"
            >
              <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Researching this address…</p>
                <p className="text-brand-800/80 mt-0.5">
                  Fetching county records and owner contact data. First lookup usually takes 5–10
                  seconds; repeat searches of the same address are much faster.
                </p>
              </div>
            </motion.div>
          )}

          {hasResults && addressLabel && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
            >
              <p className="text-label mb-0.5">Current property</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{addressLabel}</p>
            </motion.div>
          )}

          <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

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
                  <OwnerContactPanel
                    street={street}
                    city={city}
                    state={state}
                    zip={zip}
                    lookupTrigger={lookupTrigger}
                    onComplete={handleLookupComplete}
                    onLoadingChange={setLookupLoading}
                  />
                ),
              },
              {
                id: 'cma',
                content: (
                  <CmaPanel
                    street={street}
                    city={city}
                    state={state}
                    zip={zip}
                    runTrigger={cmaTrigger}
                    onComplete={handleCmaComplete}
                  />
                ),
              },
            ]}
          />
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

'use client';

import { useCallback, useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardPage from '@/components/layout/DashboardPage';
import Tabs from '@/components/ui/Tabs';
import Surface from '@/components/ui/Surface';
import Button from '@/components/ui/Button';
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
  Search, MapPin, Loader2, History, ChevronDown, Trash2, X,
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
  const [showHistory, setShowHistory] = useState(false);
  const [lookupUsage, setLookupUsage] = useState<{ current: number; limit: number } | null>(null);
  const [cmaUsage, setCmaUsage] = useState<{ current: number; limit: number } | null>(null);

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
    setShowHistory(false);
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
      size="medium"
    >
        {history.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-3"
            >
              <History className="w-4 h-4" />
              Recent ({history.length})
              <ChevronDown className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
            </button>
            {showHistory && (
              <Surface padding="none" className="overflow-hidden mb-4">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-500">Recent addresses</span>
                  <button type="button" onClick={() => { setHistory([]); localStorage.removeItem(HISTORY_KEY); setShowHistory(false); }} className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </button>
                </div>
                <div className="divide-y divide-gray-100">
                  {history.map((entry) => (
                    <button key={entry.id} type="button" onClick={() => loadHistory(entry)} className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors">
                      <p className="text-sm text-gray-900 truncate">{entry.label}</p>
                      <p className="text-xs text-gray-500">{new Date(entry.lookedUpAt).toLocaleDateString()}</p>
                    </button>
                  ))}
                </div>
              </Surface>
            )}
          </div>
        )}

        <Surface sticky padding="md">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Street address *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. 123 W Main Street"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Austin" className="w-full px-3 py-2.5 rounded-xl bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">State *</label>
                <select value={state} onChange={(e) => setState(e.target.value)} className="field-select w-full bg-gray-50">
                  <option value="">Select state</option>
                  {US_STATES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ZIP</label>
                <input type="text" value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="93291" className="w-full px-3 py-2.5 rounded-xl bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Demo: 123 W Main Street, Austin, TX — sample owner + CMA (no real PII).
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={handleResearchAddress} disabled={!street.trim() || !state} className="inline-flex items-center gap-2">
                <Search className="w-4 h-4" />
                Research address
              </Button>
              {(street || city || state || zip) && (
                <button type="button" onClick={clearForm} className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  <X className="w-4 h-4" /> Clear
                </button>
              )}
            </div>
          </div>
        </Surface>

        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab content — keep mounted to avoid re-triggering lookups on tab switch */}
        <div className={activeTab === 'overview' ? '' : 'hidden'}>
          <PropertyOverviewCard
            addressLabel={addressLabel || 'No address entered'}
            person={firstPerson}
            cmaResult={cmaResult}
            hasLookup={!!firstPerson}
            onLookUpOwner={() => { setActiveTab('owner'); if (!firstPerson) handleLookUp(); }}
            onRunCma={() => { setActiveTab('cma'); if (!cmaResult) handleRunCma(); }}
          />
        </div>

        <div className={activeTab === 'owner' ? '' : 'hidden'}>
          <OwnerContactPanel
            street={street}
            city={city}
            state={state}
            zip={zip}
            lookupTrigger={lookupTrigger}
            onComplete={handleLookupComplete}
          />
        </div>

        <div className={activeTab === 'cma' ? '' : 'hidden'}>
          <CmaPanel
            street={street}
            city={city}
            state={state}
            zip={zip}
            runTrigger={cmaTrigger}
            onComplete={handleCmaComplete}
          />
        </div>
    </DashboardPage>
  );
}

export default function PropertyResearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}>
      <PropertyResearchContent />
    </Suspense>
  );
}

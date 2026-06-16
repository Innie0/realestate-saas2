'use client';

import { useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import { useTour } from '@/hooks/useTour';
import {
  CONDITION_OPTIONS,
  defaultSubject,
  recalculateValuation,
  type ConditionLevel,
  type ScoredComp,
  type SubjectProperty,
} from '@/lib/cma';
import {
  BarChart2, Search, Loader2, AlertCircle, Home, DollarSign,
  TrendingUp, BedDouble, Bath, Ruler, Clock, MapPin, Sparkles,
  ChevronDown, ChevronUp, X, RefreshCw, Info,
} from 'lucide-react';

interface AVMResult {
  estimatedValue: number | null;
  valueLow: number | null;
  valueHigh: number | null;
  confidence: number | null;
}

interface RentEstimate {
  monthlyRent: number | null;
  rentLow: number | null;
  rentHigh: number | null;
}

interface CmaValuationResult {
  suggestedPrice: number | null;
  priceLow: number | null;
  priceHigh: number | null;
  medianAdjustedPrice: number | null;
  compCount: number;
  medianPricePerSqft: number | null;
  conditionFactor: number;
}

interface AnalysisResult {
  address: string;
  propertyType: string | null;
  radius: number;
  yearsBack: number;
  subject: SubjectProperty;
  valuation: CmaValuationResult;
  avm: AVMResult | null;
  rentEstimate: RentEstimate | null;
  comps: ScoredComp[];
  summary: string | null;
  queriedAt: string;
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY',
  'LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND',
  'OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const PROPERTY_TYPES = [
  { value: '', label: 'Auto-detect' },
  { value: 'Single Family', label: 'Single Family' },
  { value: 'Condo', label: 'Condo' },
  { value: 'Townhouse', label: 'Townhouse' },
  { value: 'Multi-Family', label: 'Multi-Family' },
  { value: 'Apartment', label: 'Apartment' },
  { value: 'Manufactured', label: 'Manufactured' },
  { value: 'Land', label: 'Land' },
];

const inputClass =
  'w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-brand-500';

function fmt(n: number | null | undefined, prefix = '', suffix = '') {
  if (n === null || n === undefined) return '—';
  return `${prefix}${n.toLocaleString()}${suffix}`;
}

function fmtDate(s: string | null) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return s;
  }
}

export default function MarketAnalysisPage() {
  useTour({
    tourKey: 'tour_market_analysis',
    steps: [
      {
        element: '[data-tour="ma-form"]',
        popover: {
          title: '🏠 Enter a Property Address',
          description: 'Enter the subject property address, load details, then run a comp-based CMA with adjusted comparable sales.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="ma-subject"]',
        popover: {
          title: '📋 Subject Property',
          description: 'Beds, baths, sqft, and condition drive comp adjustments. Load from county records or enter manually.',
          side: 'bottom',
        },
      },
    ],
  });

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [radius, setRadius] = useState(0.5);
  const [yearsBack, setYearsBack] = useState(1);
  const [subject, setSubject] = useState<SubjectProperty>(defaultSubject());
  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [excludedIds, setExcludedIds] = useState<Set<number>>(new Set());
  const [showAllComps, setShowAllComps] = useState(false);

  const buildPayload = (prefillOnly = false) => ({
    street: street.trim(),
    city: city.trim(),
    state,
    zip: zip.trim(),
    propertyType: propertyType || undefined,
    radius,
    yearsBack,
    prefillOnly,
    bedrooms: subject.bedrooms,
    bathrooms: subject.bathrooms,
    squareFootage: subject.squareFootage,
    lotSize: subject.lotSize,
    yearBuilt: subject.yearBuilt,
    condition: subject.condition,
    hasPool: subject.hasPool,
    garageSpaces: subject.garageSpaces,
  });

  const handlePrefill = async () => {
    if (!street.trim() || !state) return;
    setPrefilling(true);
    setError('');
    try {
      const res = await fetch('/api/market-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(true)),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Could not load property details.');
      } else {
        setSubject(data.data.subject);
        if (data.data.propertyType && !propertyType) {
          setPropertyType(data.data.propertyType);
        }
      }
    } catch {
      setError('Could not load property details.');
    } finally {
      setPrefilling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!street.trim() || !state) return;

    setLoading(true);
    setError('');
    setResult(null);
    setShowAllComps(false);
    setExcludedIds(new Set());

    try {
      const res = await fetch('/api/market-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(false)),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Analysis failed. Please try again.');
      } else {
        setResult(data.data);
        setSubject(data.data.subject);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeComps = result?.comps.filter((_, i) => !excludedIds.has(i)) ?? [];

  const liveValuation = useMemo(() => {
    if (!result) return null;
    return recalculateValuation(
      result.subject,
      activeComps,
      result.valuation.medianPricePerSqft
    );
  }, [result, activeComps]);

  const visibleComps = showAllComps ? activeComps : activeComps.slice(0, 5);

  const updateSubject = <K extends keyof SubjectProperty>(key: K, value: SubjectProperty[K]) => {
    setSubject((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Market Analysis"
        subtitle="Comp-based CMA with adjusted comparable sales — not just an automated estimate"
      />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">

        <div data-tour="ma-form" className="bg-white border border-gray-200 rounded-2xl p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Street Address *</label>
                <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="123 Main St" required className={inputClass} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">City</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Los Angeles" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">State *</label>
                  <select value={state} onChange={(e) => setState(e.target.value)} required className={inputClass}>
                    <option value="">State</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">ZIP</label>
                  <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="90210" maxLength={10} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Subject property */}
            <div data-tour="ma-subject" className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm font-medium text-gray-900">Subject Property Details</p>
                <button
                  type="button"
                  onClick={handlePrefill}
                  disabled={prefilling || !street.trim() || !state}
                  className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
                >
                  {prefilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Load from county records
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Beds</label>
                  <input type="number" min={0} max={20} value={subject.bedrooms ?? ''} onChange={(e) => updateSubject('bedrooms', e.target.value ? Number(e.target.value) : null)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Baths</label>
                  <input type="number" min={0} max={20} step={0.5} value={subject.bathrooms ?? ''} onChange={(e) => updateSubject('bathrooms', e.target.value ? Number(e.target.value) : null)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Sq Ft</label>
                  <input type="number" min={0} value={subject.squareFootage ?? ''} onChange={(e) => updateSubject('squareFootage', e.target.value ? Number(e.target.value) : null)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Year Built</label>
                  <input type="number" min={1800} max={2030} value={subject.yearBuilt ?? ''} onChange={(e) => updateSubject('yearBuilt', e.target.value ? Number(e.target.value) : null)} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Condition</label>
                  <select value={subject.condition} onChange={(e) => updateSubject('condition', e.target.value as ConditionLevel)} className={inputClass}>
                    {CONDITION_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Garage Spaces</label>
                  <input type="number" min={0} max={10} value={subject.garageSpaces} onChange={(e) => updateSubject('garageSpaces', Number(e.target.value) || 0)} className={inputClass} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={subject.hasPool} onChange={(e) => updateSubject('hasPool', e.target.checked)} className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                    Has pool
                  </label>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div data-tour="ma-property-type">
                <label className="block text-xs text-gray-500 mb-1">Property Type</label>
                <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className={inputClass}>
                  {PROPERTY_TYPES.map((pt) => (
                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-2">Radius — {radius} mi</label>
                  <input type="range" min={0.25} max={2} step={0.25} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full accent-brand-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">History — {yearsBack} yr{yearsBack !== 1 ? 's' : ''}</label>
                  <input type="range" min={1} max={5} step={1} value={yearsBack} onChange={(e) => setYearsBack(Number(e.target.value))} className="w-full accent-brand-500" />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !street.trim() || !state}
              className="w-full flex items-center justify-center gap-2 bg-brand-500 text-white font-semibold py-2.5 rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Running CMA…</>
              ) : (
                <><Search className="w-4 h-4" /> Run Comp-Based Analysis</>
              )}
            </button>
          </form>
        </div>

        {loading && (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
                <div className="h-4 bg-gray-50 rounded w-1/3" />
                <div className="h-8 bg-gray-50 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {result && !loading && liveValuation && (
          <div className="space-y-4">

            <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium text-gray-900">{result.address}</span>
              {result.propertyType && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">{result.propertyType}</span>
              )}
              {result.subject.squareFootage && (
                <span className="text-xs text-gray-500">{result.subject.bedrooms ?? '?'}bd · {result.subject.bathrooms ?? '?'}ba · {result.subject.squareFootage.toLocaleString()} sqft</span>
              )}
            </div>

            {/* Primary: comp-based CMA */}
            <div className="bg-white border-2 border-brand-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-brand-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Suggested List Price</p>
                  <p className="text-xs text-gray-500">Based on {liveValuation.compCount} adjusted comparable sale{liveValuation.compCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              {liveValuation.suggestedPrice ? (
                <>
                  <p className="text-4xl font-bold text-gray-900 mb-1">{fmt(liveValuation.suggestedPrice, '$')}</p>
                  <p className="text-sm text-gray-600">
                    Comp range: {fmt(liveValuation.priceLow, '$')} – {fmt(liveValuation.priceHigh, '$')}
                  </p>
                  {liveValuation.medianPricePerSqft && (
                    <p className="text-xs text-gray-500 mt-1">Median ${liveValuation.medianPricePerSqft}/sqft · Condition factor applied</p>
                  )}
                </>
              ) : (
                <p className="text-gray-500 text-sm">Not enough comparable sales. Try widening radius or sales history.</p>
              )}
            </div>

            {/* Secondary: AVM + rent */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 opacity-90">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Home className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">AVM Reference</p>
                    <p className="text-[10px] text-gray-400">Automated estimate — may lag market</p>
                  </div>
                </div>
                {result.avm?.estimatedValue ? (
                  <>
                    <p className="text-2xl font-bold text-gray-700 mb-1">{fmt(result.avm.estimatedValue, '$')}</p>
                    <p className="text-xs text-gray-500">Range: {fmt(result.avm.valueLow, '$')} – {fmt(result.avm.valueHigh, '$')}</p>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">Not available</p>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-brand-500" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Monthly Rent Estimate</p>
                </div>
                {result.rentEstimate?.monthlyRent ? (
                  <>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {fmt(result.rentEstimate.monthlyRent, '$')}<span className="text-base text-gray-500 font-normal">/mo</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Range: {fmt(result.rentEstimate.rentLow, '$')} – {fmt(result.rentEstimate.rentHigh, '$')}/mo
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">Not available</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              Not an appraisal. Comp-based pricing adjusts for size, beds/baths, and condition. Exclude poor comps below to refine the estimate.
            </div>

            {result.summary && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-brand-500" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Market Summary</p>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{result.summary}</p>
              </div>
            )}

            {/* Comps */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Comparable Sales</p>
                <span className="ml-auto text-xs text-gray-600">{result.radius} mi · {result.yearsBack} yr</span>
              </div>

              {activeComps.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  {result.comps.length === 0 ? 'No comparable sales found.' : 'All comps excluded — restore or run a new search.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {visibleComps.map((comp) => {
                    const realIdx = result.comps.indexOf(comp);
                    const conditionedAdj = comp.adjustedPrice
                      ? Math.round(comp.adjustedPrice * liveValuation.conditionFactor)
                      : null;
                    return (
                      <div key={realIdx} className="border border-gray-200 rounded-xl p-3.5 bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-gray-900">{comp.address}</p>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 border border-brand-200">
                                Match {comp.similarityScore}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-bold text-brand-500">{fmt(comp.price, '$')}</p>
                              {conditionedAdj && (
                                <p className="text-[10px] text-gray-500">Adj. {fmt(conditionedAdj, '$')}</p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setExcludedIds((prev) => new Set([...prev, realIdx]))}
                              className="p-1 rounded hover:bg-gray-100 text-gray-600 hover:text-red-500 transition-colors"
                              title="Exclude this comp"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
                          {comp.bedrooms !== null && <span className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> {comp.bedrooms} bd</span>}
                          {comp.bathrooms !== null && <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> {comp.bathrooms} ba</span>}
                          {comp.squareFootage !== null && <span className="flex items-center gap-1"><Ruler className="w-3 h-3" /> {comp.squareFootage.toLocaleString()} sqft</span>}
                          {comp.pricePerSqft !== null && <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" /> ${comp.pricePerSqft}/sqft</span>}
                          {comp.soldDate && <span>Sold {fmtDate(comp.soldDate)}</span>}
                          {comp.distance !== null && <span>{comp.distance.toFixed(2)} mi</span>}
                        </div>
                        {comp.adjustments.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {comp.adjustments.map((adj, j) => (
                              <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                {adj.label}: {adj.amount >= 0 ? '+' : ''}{fmt(adj.amount, '$')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {activeComps.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setShowAllComps((v) => !v)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {showAllComps ? <><ChevronUp className="w-3.5 h-3.5" /> Show fewer</> : <><ChevronDown className="w-3.5 h-3.5" /> Show all {activeComps.length} comps</>}
                    </button>
                  )}
                  {excludedIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setExcludedIds(new Set())}
                      className="w-full text-xs text-gray-600 hover:text-gray-900 py-1.5 transition-colors"
                    >
                      Restore {excludedIds.size} excluded comp{excludedIds.size !== 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

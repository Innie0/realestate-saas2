'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import {
  CONDITION_OPTIONS,
  defaultSubject,
  recalculateValuation,
  type ConditionLevel,
  type ScoredComp,
  type SubjectProperty,
} from '@/lib/cma';
import {
  BarChart2, Loader2, AlertCircle, Home, DollarSign,
  TrendingUp, BedDouble, Bath, Ruler, MapPin, Sparkles,
  ChevronDown, ChevronUp, X, RefreshCw, Info, Download,
} from 'lucide-react';
import { buildCmaPdfPayload, downloadCmaPdf } from '@/lib/export-cma-pdf';

export interface CmaValuationResult {
  suggestedPrice: number | null;
  priceLow: number | null;
  priceHigh: number | null;
  medianAdjustedPrice: number | null;
  compCount: number;
  medianPricePerSqft: number | null;
  conditionFactor: number;
}

export interface SubjectEnrichmentMeta {
  hasPool: 'county' | 'mls' | 'heuristic' | 'ai' | 'default';
  garageSpaces: 'county' | 'mls' | 'heuristic' | 'ai' | 'default';
  condition: 'county' | 'mls' | 'heuristic' | 'ai' | 'default';
}

export interface CmaAnalysisResult {
  address: string;
  propertyType: string | null;
  radius: number;
  yearsBack: number;
  subject: SubjectProperty;
  subjectEnrichment?: SubjectEnrichmentMeta | null;
  valuation: CmaValuationResult;
  activeListing: {
    address: string;
    price: number | null;
    listedDate: string | null;
    mlsNumber: string | null;
  } | null;
  compsFiltered: number;
  avm: {
    estimatedValue: number | null;
    valueLow: number | null;
    valueHigh: number | null;
    confidence: number | null;
  } | null;
  rentEstimate: {
    monthlyRent: number | null;
    rentLow: number | null;
    rentHigh: number | null;
  } | null;
  comps: ScoredComp[];
  summary: string | null;
  queriedAt: string;
}

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

function enrichmentLabel(source: SubjectEnrichmentMeta[keyof SubjectEnrichmentMeta] | undefined) {
  switch (source) {
    case 'county':
      return 'County records';
    case 'mls':
      return 'MLS listing';
    case 'heuristic':
      return 'Estimated from price & size';
    case 'ai':
      return 'AI from listing remarks';
    default:
      return null;
  }
}

function AutoDetectHint({ source }: { source: SubjectEnrichmentMeta[keyof SubjectEnrichmentMeta] | undefined }) {
  const label = enrichmentLabel(source);
  if (!label) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-brand-600 mt-0.5">
      <Sparkles className="w-3 h-3" />
      Auto: {label}
    </span>
  );
}

function fmtDate(s: string | null) {
  if (!s) return '—';
  try {
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return s;
  }
}

export interface CmaPanelProps {
  street: string;
  city: string;
  state: string;
  zip: string;
  /** Increment to trigger a CMA run from the parent */
  runTrigger?: number;
  onComplete?: (result: CmaAnalysisResult | null) => void;
}

export function CmaPanel({ street, city, state, zip, runTrigger = 0, onComplete }: CmaPanelProps) {
  const [propertyType, setPropertyType] = useState('');
  const [radius, setRadius] = useState(0.5);
  const [yearsBack, setYearsBack] = useState(1);
  const [subject, setSubject] = useState<SubjectProperty>(defaultSubject());
  const [subjectEnrichment, setSubjectEnrichment] = useState<SubjectEnrichmentMeta | null>(null);
  const [manualFields, setManualFields] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CmaAnalysisResult | null>(null);
  const [excludedIds, setExcludedIds] = useState<Set<number>>(new Set());
  const [showAllComps, setShowAllComps] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const isRunningRef = useRef(false);
  const lastTriggerRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const buildPayload = (prefillOnly = false) => ({
    street: street.trim(),
    city: city.trim(),
    state,
    zip: zip.trim(),
    propertyType: propertyType || undefined,
    radius,
    yearsBack,
    prefillOnly,
    manualFields: Array.from(manualFields),
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
        setSubjectEnrichment(data.data.subjectEnrichment ?? null);
        setManualFields(new Set());
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

  const runAnalysis = useCallback(async () => {
    if (isRunningRef.current) return;
    if (!street.trim() || !state) {
      setError('Enter a street address and state above first.');
      return;
    }

    isRunningRef.current = true;
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
        onCompleteRef.current?.(null);
      } else {
        setResult(data.data);
        setSubject(data.data.subject);
        setSubjectEnrichment(data.data.subjectEnrichment ?? null);
        onCompleteRef.current?.(data.data);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      onCompleteRef.current?.(null);
    } finally {
      isRunningRef.current = false;
      setLoading(false);
    }
  }, [street, city, state, zip, propertyType, radius, yearsBack, subject, manualFields]);

  useEffect(() => {
    setSubject(defaultSubject());
    setSubjectEnrichment(null);
    setManualFields(new Set());
    setResult(null);
    setError('');
  }, [street, city, state, zip]);

  useEffect(() => {
    if (runTrigger <= 0 || runTrigger === lastTriggerRef.current) return;
    lastTriggerRef.current = runTrigger;
    runAnalysis();
  }, [runTrigger, runAnalysis]);

  const activeComps = result?.comps.filter((_, i) => !excludedIds.has(i)) ?? [];

  const liveValuation = useMemo(() => {
    if (!result) return null;
    return recalculateValuation(result.subject, activeComps, result.valuation.medianPricePerSqft);
  }, [result, activeComps]);

  const visibleComps = showAllComps ? activeComps : activeComps.slice(0, 5);

  const updateSubject = <K extends keyof SubjectProperty>(key: K, value: SubjectProperty[K]) => {
    if (key === 'condition' || key === 'hasPool' || key === 'garageSpaces') {
      setManualFields((prev) => new Set(prev).add(key));
    }
    setSubject((prev) => ({ ...prev, [key]: value }));
  };

  const handleExportPdf = async () => {
    if (!result || !liveValuation) return;
    setExportingPdf(true);
    setError('');
    try {
      const payload = buildCmaPdfPayload(result, {
        subject,
        comps: activeComps,
        valuation: liveValuation,
      });
      await downloadCmaPdf(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
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
              {!manualFields.has('condition') && (
                <AutoDetectHint source={subjectEnrichment?.condition} />
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Garage Spaces</label>
              <input type="number" min={0} max={10} value={subject.garageSpaces} onChange={(e) => updateSubject('garageSpaces', Number(e.target.value) || 0)} className={inputClass} />
              {!manualFields.has('garageSpaces') && (
                <AutoDetectHint source={subjectEnrichment?.garageSpaces} />
              )}
            </div>
            <div className="flex flex-col justify-end pb-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={subject.hasPool} onChange={(e) => updateSubject('hasPool', e.target.checked)} className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                Has pool
              </label>
              {!manualFields.has('hasPool') && (
                <AutoDetectHint source={subjectEnrichment?.hasPool} />
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            Pool and garage come from county/MLS when available. Luxury condition is estimated from price, size, and listing text — verify before sharing with a client.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
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
          type="button"
          onClick={runAnalysis}
          disabled={loading || !street.trim() || !state}
          className="w-full flex items-center justify-center gap-2 bg-brand-500 text-white font-semibold py-2.5 rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Running CMA…</>
          ) : (
            <><TrendingUp className="w-4 h-4" /> Run Comp-Based Analysis</>
          )}
        </button>

        {result && liveValuation && !loading && (
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exportingPdf}
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-brand-500 text-brand-600 font-semibold py-2.5 rounded-xl hover:bg-brand-50 transition-colors disabled:opacity-50"
          >
            {exportingPdf ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF…</>
            ) : (
              <><Download className="w-4 h-4" /> Export Seller PDF</>
            )}
          </button>
        )}
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
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap min-w-0">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium text-gray-900">{result.address}</span>
              {result.propertyType && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">{result.propertyType}</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 border border-brand-200 bg-brand-50 hover:bg-brand-100 rounded-lg px-3 py-2 disabled:opacity-50"
            >
              {exportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export seller PDF
            </button>
          </div>

          {result.activeListing && (
            <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Currently listed for sale</p>
                <p className="text-xs mt-0.5 text-amber-700">
                  List price: {fmt(result.activeListing.price, '$')}
                  {result.activeListing.mlsNumber && ` · MLS #${result.activeListing.mlsNumber}`}
                </p>
              </div>
            </div>
          )}

          {result.compsFiltered > 0 && (
            <p className="text-xs text-gray-500">
              {result.compsFiltered} invalid listing{result.compsFiltered !== 1 ? 's' : ''} removed from comps.
            </p>
          )}

          <div className="bg-white border-2 border-brand-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Suggested List Price</p>
                <p className="text-xs text-gray-500">Based on {liveValuation.compCount} adjusted comp{liveValuation.compCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {liveValuation.suggestedPrice ? (
              <>
                <p className="text-4xl font-bold text-gray-900 mb-1">{fmt(liveValuation.suggestedPrice, '$')}</p>
                <p className="text-sm text-gray-600">Range: {fmt(liveValuation.priceLow, '$')} – {fmt(liveValuation.priceHigh, '$')}</p>
              </>
            ) : (
              <p className="text-gray-500 text-sm">Not enough comps. Widen radius or history.</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm text-gray-500 mb-2">AVM Reference</p>
              {result.avm?.estimatedValue ? (
                <p className="text-2xl font-bold text-gray-700">{fmt(result.avm.estimatedValue, '$')}</p>
              ) : (
                <p className="text-gray-500 text-sm">Not available</p>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm text-gray-500 mb-2">Rent Estimate</p>
              {result.rentEstimate?.monthlyRent ? (
                <p className="text-2xl font-bold text-gray-900">{fmt(result.rentEstimate.monthlyRent, '$')}<span className="text-base font-normal text-gray-500">/mo</span></p>
              ) : (
                <p className="text-gray-500 text-sm">Not available</p>
              )}
            </div>
          </div>

          {result.summary && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <p className="text-sm text-gray-500 font-medium">Market Summary</p>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{result.summary}</p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm text-gray-500 font-medium mb-4">Comparable Sales</p>
            {activeComps.length === 0 ? (
              <p className="text-gray-500 text-sm">No comps available.</p>
            ) : (
              <div className="space-y-3">
                {visibleComps.map((comp) => {
                  const realIdx = result.comps.indexOf(comp);
                  const conditionedAdj = comp.adjustedPrice
                    ? Math.round(comp.adjustedPrice * liveValuation.conditionFactor)
                    : null;
                  return (
                    <div key={realIdx} className="border border-gray-200 rounded-xl p-3.5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-gray-900">{comp.address}</p>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm font-bold text-brand-500">{fmt(comp.price, '$')}</p>
                            {conditionedAdj && <p className="text-[10px] text-gray-500">Adj. {fmt(conditionedAdj, '$')}</p>}
                          </div>
                          <button type="button" onClick={() => setExcludedIds((prev) => new Set([...prev, realIdx]))} className="p-1 text-gray-400 hover:text-red-500">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        {comp.bedrooms !== null && <span>{comp.bedrooms} bd</span>}
                        {comp.bathrooms !== null && <span>{comp.bathrooms} ba</span>}
                        {comp.squareFootage !== null && <span>{comp.squareFootage.toLocaleString()} sqft</span>}
                        {comp.soldDate && <span>Sold {fmtDate(comp.soldDate)}</span>}
                      </div>
                    </div>
                  );
                })}
                {activeComps.length > 5 && (
                  <button type="button" onClick={() => setShowAllComps((v) => !v)} className="w-full text-xs text-gray-500 py-2 border border-gray-200 rounded-lg">
                    {showAllComps ? 'Show fewer' : `Show all ${activeComps.length} comps`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!result && !loading && (
        <p className="text-sm text-gray-500 text-center py-8">
          Configure subject details above, then run the comp-based analysis.
        </p>
      )}
    </div>
  );
}

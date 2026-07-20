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
import { useToast } from '@/components/providers/ToastProvider';
import Select from '@/components/ui/Select';
import {
  BarChart2, Loader2, AlertCircle, Home, DollarSign,
  TrendingUp, BedDouble, Bath, Ruler, MapPin, Sparkles,
  ChevronDown, ChevronUp, X, RefreshCw, Info, Download,
} from 'lucide-react';
import { buildCmaPdfPayload, downloadCmaPdf } from '@/lib/export-cma-pdf';
import { normalizeAddressKey } from '@/lib/property-research-cache';
import { isDemoMarketingAddress } from '@/lib/demo-property-research';
import {
  cmaLocalCacheKey,
  findLatestCmaCache,
  getLocalResearchCache,
  setLocalResearchCache,
} from '@/lib/research-local-cache';

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
  isDemo?: boolean;
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
  'w-full bg-gray-50 border border-gray-200 rounded-[10px] px-3 py-2.5 text-gray-900 text-[13px] placeholder-gray-450 focus:outline-none focus:border-gray-400';

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
    <span className="inline-flex items-center gap-1 text-[10.5px] text-gray-600 mt-0.5">
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
  /** Parent-held CMA result (e.g. from recent history cache) */
  initialResult?: CmaAnalysisResult | null;
  onComplete?: (result: CmaAnalysisResult | null) => void;
}

function cmaMatchesFields(
  data: CmaAnalysisResult,
  street: string,
  city: string,
  state: string,
  zip: string
): boolean {
  const addressKey = normalizeAddressKey({
    street: street.trim(),
    city: city.trim(),
    state,
    zip: zip.trim(),
  });
  const latest = findLatestCmaCache<CmaAnalysisResult>(addressKey);
  return latest?.queriedAt === data.queriedAt;
}

export function CmaPanel({
  street,
  city,
  state,
  zip,
  runTrigger = 0,
  initialResult = null,
  onComplete,
}: CmaPanelProps) {
  const toast = useToast();
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
  const [fromCache, setFromCache] = useState(false);
  const isRunningRef = useRef(false);
  const lastTriggerRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const buildPayload = (prefillOnly = false, forceRefresh = false) => ({
    street: street.trim(),
    city: city.trim(),
    state,
    zip: zip.trim(),
    propertyType: propertyType || undefined,
    radius,
    yearsBack,
    prefillOnly,
    forceRefresh,
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

  const runAnalysis = useCallback(async (forceRefresh = false) => {
    if (isRunningRef.current) return;
    if (!street.trim() || !state) {
      setError('Enter a street address and state above first.');
      return;
    }

    const addressKey = normalizeAddressKey({
      street: street.trim(),
      city: city.trim(),
      state,
      zip: zip.trim(),
    });
    const localKey = cmaLocalCacheKey(addressKey, {
      propertyType: propertyType || undefined,
      radius,
      yearsBack,
    });
    const isDemo = isDemoMarketingAddress({
      street: street.trim(),
      city: city.trim(),
      state,
      zip: zip.trim(),
    });

    if (!forceRefresh && !isDemo) {
      const cached = getLocalResearchCache<CmaAnalysisResult>(localKey);
      if (cached) {
        setResult(cached);
        setSubject(cached.subject);
        setSubjectEnrichment(cached.subjectEnrichment ?? null);
        setFromCache(true);
        setError('');
        onCompleteRef.current?.(cached);
        return;
      }
      const latest = findLatestCmaCache<CmaAnalysisResult>(addressKey);
      if (latest) {
        setResult(latest);
        setSubject(latest.subject);
        setSubjectEnrichment(latest.subjectEnrichment ?? null);
        setFromCache(true);
        if (latest.propertyType) setPropertyType(latest.propertyType);
        setRadius(latest.radius ?? 0.5);
        setYearsBack(latest.yearsBack ?? 1);
        setError('');
        onCompleteRef.current?.(latest);
        return;
      }
    }

    isRunningRef.current = true;
    setLoading(true);
    setError('');
    setResult(null);
    setFromCache(false);
    setShowAllComps(false);
    setExcludedIds(new Set());

    try {
      const res = await fetch('/api/market-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(false, forceRefresh)),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Analysis failed. Please try again.');
        onCompleteRef.current?.(null);
      } else {
        setResult(data.data);
        setSubject(data.data.subject);
        setSubjectEnrichment(data.data.subjectEnrichment ?? null);
        setFromCache(!!data.fromCache);
        setLocalResearchCache(localKey, data.data);
        onCompleteRef.current?.(data.data);
        toast.success('CMA analysis complete');
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
    if (
      initialResult &&
      cmaMatchesFields(initialResult, street, city, state, zip) &&
      !isRunningRef.current &&
      !loading
    ) {
      setResult(initialResult);
      setSubject(initialResult.subject);
      setSubjectEnrichment(initialResult.subjectEnrichment ?? null);
      setFromCache(true);
      if (initialResult.propertyType) setPropertyType(initialResult.propertyType);
      setRadius(initialResult.radius ?? 0.5);
      setYearsBack(initialResult.yearsBack ?? 1);
      setError('');
      setExcludedIds(new Set());
      setShowAllComps(false);
      return;
    }
    if (!isRunningRef.current && !loading) {
      setSubject(defaultSubject());
      setSubjectEnrichment(null);
      setManualFields(new Set());
      setResult(null);
      setFromCache(false);
      setError('');
      setExcludedIds(new Set());
      setShowAllComps(false);
    }
  }, [street, city, state, zip, initialResult, loading]);

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
      toast.success('CMA PDF downloaded');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not export PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      {!result && (
      <div className="border border-gray-150 rounded-[10px] p-5 space-y-4 bg-gray-50/50">
        <div data-tour="ma-subject" className="border border-gray-150 rounded-[10px] p-4 bg-gray-50 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-[14px] font-semibold text-gray-900">Subject Property Details</p>
            <button
              type="button"
              onClick={handlePrefill}
              disabled={prefilling || !street.trim() || !state}
              className="flex items-center gap-1.5 text-[12.5px] font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
            >
              {prefilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Load from county records
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[12.5px] text-gray-600 mb-1">Beds</label>
              <input type="number" min={0} max={20} value={subject.bedrooms ?? ''} onChange={(e) => updateSubject('bedrooms', e.target.value ? Number(e.target.value) : null)} className={inputClass} />
            </div>
            <div>
              <label className="block text-[12.5px] text-gray-600 mb-1">Baths</label>
              <input type="number" min={0} max={20} step={0.5} value={subject.bathrooms ?? ''} onChange={(e) => updateSubject('bathrooms', e.target.value ? Number(e.target.value) : null)} className={inputClass} />
            </div>
            <div>
              <label className="block text-[12.5px] text-gray-600 mb-1">Sq Ft</label>
              <input type="number" min={0} value={subject.squareFootage ?? ''} onChange={(e) => updateSubject('squareFootage', e.target.value ? Number(e.target.value) : null)} className={inputClass} />
            </div>
            <div>
              <label className="block text-[12.5px] text-gray-600 mb-1">Year Built</label>
              <input type="number" min={1800} max={2030} value={subject.yearBuilt ?? ''} onChange={(e) => updateSubject('yearBuilt', e.target.value ? Number(e.target.value) : null)} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[12.5px] text-gray-600 mb-1">Condition</label>
              <Select
                value={subject.condition}
                onChange={(value) => updateSubject('condition', value as ConditionLevel)}
                triggerClassName={inputClass}
                options={CONDITION_OPTIONS.map((c) => ({ value: c.value, label: c.label }))}
              />
              {!manualFields.has('condition') && (
                <AutoDetectHint source={subjectEnrichment?.condition} />
              )}
            </div>
            <div>
              <label className="block text-[12.5px] text-gray-600 mb-1">Garage Spaces</label>
              <input type="number" min={0} max={10} value={subject.garageSpaces} onChange={(e) => updateSubject('garageSpaces', Number(e.target.value) || 0)} className={inputClass} />
              {!manualFields.has('garageSpaces') && (
                <AutoDetectHint source={subjectEnrichment?.garageSpaces} />
              )}
            </div>
            <div className="flex flex-col justify-end pb-1">
              <label className="flex items-center gap-2 text-[13px] text-gray-700 cursor-pointer">
                <input type="checkbox" checked={subject.hasPool} onChange={(e) => updateSubject('hasPool', e.target.checked)} className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                Has pool
              </label>
              {!manualFields.has('hasPool') && (
                <AutoDetectHint source={subjectEnrichment?.hasPool} />
              )}
            </div>
          </div>
          <p className="text-[12px] text-gray-600 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            Pool and garage come from county/MLS when available. Luxury condition is estimated from price, size, and listing text — verify before sharing with a client.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[12.5px] text-gray-600 mb-1">Property Type</label>
            <Select
              value={propertyType}
              onChange={setPropertyType}
              triggerClassName={inputClass}
              options={PROPERTY_TYPES.map((pt) => ({ value: pt.value, label: pt.label }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] text-gray-600 mb-2">Radius — {radius} mi</label>
              <input type="range" min={0.25} max={2} step={0.25} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full accent-brand-500" />
            </div>
            <div>
              <label className="block text-[12.5px] text-gray-600 mb-2">History — {yearsBack} yr{yearsBack !== 1 ? 's' : ''}</label>
              <input type="range" min={1} max={5} step={1} value={yearsBack} onChange={(e) => setYearsBack(Number(e.target.value))} className="w-full accent-brand-500" />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-rose-700 text-[13px] bg-rose-50 border border-rose-200 rounded-[10px] px-3 py-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={() => runAnalysis()}
          disabled={loading || !street.trim() || !state}
          className="w-full flex items-center justify-center gap-2 bg-brand-500 text-white text-[13.5px] font-semibold py-2.5 rounded-[10px] hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Running CMA…</>
          ) : (
            <><TrendingUp className="w-4 h-4" /> Run Comp-Based Analysis</>
          )}
        </button>
      </div>
      )}

      {loading && (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="bg-[var(--surface)] border border-gray-200 rounded-[10px] p-5 space-y-3">
              <div className="h-4 bg-gray-100 rounded w-1/3" />
              <div className="h-8 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {result && !loading && liveValuation && (
        <div className="space-y-4">
          {result.isDemo && (
            <div className="rounded-[10px] border border-gray-200 bg-gray-50 px-4 py-3 text-[13px] text-gray-600">
              Sample marketing CMA — comps and valuation are fictional for demo purposes.
            </div>
          )}
          {fromCache && !result.isDemo && (
            <div className="flex items-center justify-between gap-3 flex-wrap text-[13px] bg-emerald-50 border border-emerald-200 rounded-[10px] px-4 py-3">
              <span className="text-emerald-800">Loaded from saved search — no API usage.</span>
              <button
                type="button"
                onClick={() => runAnalysis(true)}
                className="text-[12.5px] font-medium text-emerald-700 hover:text-emerald-900 underline"
              >
                Refresh live data
              </button>
            </div>
          )}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-[13px] text-gray-700 flex-wrap min-w-0">
              <MapPin className="w-4 h-4 flex-shrink-0 text-gray-600" />
              <span className="font-medium text-gray-900">{result.address}</span>
              {result.propertyType && (
                <span className="text-[12px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">{result.propertyType}</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 border border-gray-200 bg-[var(--surface)] hover:bg-gray-50 hover:border-gray-300 rounded-[10px] px-3 py-2 transition-colors disabled:opacity-50"
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
            <div className="flex items-start gap-2 text-[13px] text-amber-800 bg-amber-50 border border-amber-200 rounded-[10px] px-4 py-3">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Currently listed for sale</p>
                <p className="text-[12px] mt-0.5 text-amber-700">
                  List price: {fmt(result.activeListing.price, '$')}
                  {result.activeListing.mlsNumber && ` · MLS #${result.activeListing.mlsNumber}`}
                </p>
              </div>
            </div>
          )}

          {result.compsFiltered > 0 && (
            <p className="text-[12.5px] text-gray-600">
              {result.compsFiltered} invalid listing{result.compsFiltered !== 1 ? 's' : ''} removed from comps.
            </p>
          )}

          <div className="bg-[var(--surface)] border border-gray-200 rounded-[10px] p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-[10px] bg-gray-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-gray-900" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-900">Suggested List Price</p>
                <p className="text-[12px] text-gray-600">Based on {liveValuation.compCount} adjusted comp{liveValuation.compCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
            {liveValuation.suggestedPrice ? (
              <>
                <p className="text-[28px] font-bold text-gray-900 mb-1">{fmt(liveValuation.suggestedPrice, '$')}</p>
                <p className="text-[13px] text-gray-600">Range: {fmt(liveValuation.priceLow, '$')} – {fmt(liveValuation.priceHigh, '$')}</p>
              </>
            ) : (
              <p className="text-gray-600 text-[13px]">Not enough comps. Widen radius or history.</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[var(--surface)] border border-gray-200 rounded-[10px] p-5">
              <p className="text-[12.5px] text-gray-600 mb-2">AVM Reference</p>
              {result.avm?.estimatedValue ? (
                <p className="text-[22px] font-bold text-gray-700">{fmt(result.avm.estimatedValue, '$')}</p>
              ) : (
                <p className="text-gray-600 text-[13px]">Not available</p>
              )}
            </div>
            <div className="bg-[var(--surface)] border border-gray-200 rounded-[10px] p-5">
              <p className="text-[12.5px] text-gray-600 mb-2">Rent Estimate</p>
              {result.rentEstimate?.monthlyRent ? (
                <p className="text-[22px] font-bold text-gray-900">{fmt(result.rentEstimate.monthlyRent, '$')}<span className="text-[14px] font-normal text-gray-600">/mo</span></p>
              ) : (
                <p className="text-gray-600 text-[13px]">Not available</p>
              )}
            </div>
          </div>

          {result.summary && (
            <div className="bg-[var(--surface)] border border-gray-200 rounded-[10px] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-gray-700" />
                <p className="text-[12.5px] text-gray-600 font-medium">Market Summary</p>
              </div>
              <p className="text-gray-600 text-[13px] leading-relaxed">{result.summary}</p>
            </div>
          )}

          <div className="bg-[var(--surface)] border border-gray-200 rounded-[10px] p-5">
            <p className="text-[12.5px] text-gray-600 font-medium mb-4">Comparable Sales</p>
            {activeComps.length === 0 ? (
              <p className="text-gray-600 text-[13px]">No comps available.</p>
            ) : (
              <div className="space-y-3">
                {visibleComps.map((comp) => {
                  const realIdx = result.comps.indexOf(comp);
                  const conditionedAdj = comp.adjustedPrice
                    ? Math.round(comp.adjustedPrice * liveValuation.conditionFactor)
                    : null;
                  return (
                    <div key={realIdx} className="border border-gray-150 rounded-[10px] p-3.5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-[13px] font-medium text-gray-900">{comp.address}</p>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-[13px] font-bold text-gray-900">{fmt(comp.price, '$')}</p>
                            {conditionedAdj && <p className="text-[10.5px] text-gray-600">Adj. {fmt(conditionedAdj, '$')}</p>}
                          </div>
                          <button type="button" onClick={() => setExcludedIds((prev) => new Set([...prev, realIdx]))} className="p-1 text-gray-400 hover:text-rose-500">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-[12px] text-gray-600">
                        {comp.bedrooms !== null && <span>{comp.bedrooms} bd</span>}
                        {comp.bathrooms !== null && <span>{comp.bathrooms} ba</span>}
                        {comp.squareFootage !== null && <span>{comp.squareFootage.toLocaleString()} sqft</span>}
                        {comp.soldDate && <span>Sold {fmtDate(comp.soldDate)}</span>}
                      </div>
                    </div>
                  );
                })}
                {activeComps.length > 5 && (
                  <button type="button" onClick={() => setShowAllComps((v) => !v)} className="w-full text-[12.5px] text-gray-700 hover:text-gray-900 py-2 border border-gray-200 rounded-[10px] hover:bg-gray-50 transition-colors">
                    {showAllComps ? 'Show fewer' : `Show all ${activeComps.length} comps`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!result && !loading && (
        <p className="text-[13px] text-gray-600 text-center py-8">
          Configure subject details above, then run the comp-based analysis.
        </p>
      )}
    </div>
  );
}

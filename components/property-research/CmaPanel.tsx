'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  defaultSubject,
  recalculateValuation,
  type ScoredComp,
  type SubjectProperty,
} from '@/lib/cma';
import { useToast } from '@/components/providers/ToastProvider';
import DataLoadingState from '@/components/dashboard/DataLoadingState';
import CmaSubjectSummary from '@/components/property-research/CmaSubjectSummary';
import CmaSearchParams, {
  CMA_DEFAULT_RADIUS,
  CMA_DEFAULT_YEARS_BACK,
} from '@/components/property-research/CmaSearchParams';
import {
  Loader2, AlertCircle,
  TrendingUp, Sparkles,
  X, Download, Info,
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
import { subjectFromLookupPerson } from '@/lib/cma-prefill-from-lookup';
import type { MapCoordinate } from '@/lib/cma-map-utils';
import type { LookupResponse } from '@/components/property-research/OwnerContactPanel';

const CmaCompsMap = dynamic(() => import('@/components/property-research/CmaCompsMap'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[320px] w-full animate-pulse rounded-[10px] border border-gray-200 bg-gray-100 lg:min-h-[calc(100vh-280px)]" />
  ),
});

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
  subjectLocation?: MapCoordinate | null;
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

export interface CmaPanelProps {
  street: string;
  city: string;
  state: string;
  zip: string;
  /** Parent-held owner lookup (used to prefill subject fields) */
  lookupData?: LookupResponse | null;
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
  lookupData = null,
  runTrigger = 0,
  initialResult = null,
  onComplete,
}: CmaPanelProps) {
  const toast = useToast();
  const [propertyType, setPropertyType] = useState('');
  const [radius, setRadius] = useState(0.5);
  const [yearsBack, setYearsBack] = useState(1);
  const [subject, setSubject] = useState<SubjectProperty>(defaultSubject());
  const [subjectLocation, setSubjectLocation] = useState<MapCoordinate | null>(null);
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
  const [paramsExpanded, setParamsExpanded] = useState(true);
  const prevLoadingRef = useRef(false);
  const isRunningRef = useRef(false);
  const lastTriggerRef = useRef(0);
  const prevAddressKeyRef = useRef('');
  const lastPrefilledKeyRef = useRef<string | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const addressKey = useMemo(
    () =>
      normalizeAddressKey({
        street: street.trim(),
        city: city.trim(),
        state,
        zip: zip.trim(),
      }),
    [street, city, state, zip],
  );

  const formattedAddress = useMemo(() => {
    const parts = [street.trim(), city.trim(), `${state} ${zip.trim()}`.trim()].filter(Boolean);
    return parts.join(', ');
  }, [street, city, state, zip]);

  const lookupCoords = useMemo(() => {
    const person = lookupData?.found && lookupData.results?.[0] ? lookupData.results[0] : null;
    const lat = person?.propertyAddress?.latitude;
    const lng = person?.propertyAddress?.longitude;
    if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
      return { latitude: lat, longitude: lng };
    }
    return null;
  }, [lookupData]);

  const mapSubjectLocation = subjectLocation ?? result?.subjectLocation ?? lookupCoords;

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

  const applyPrefillData = useCallback(
    (data: {
      subject: SubjectProperty;
      subjectEnrichment?: SubjectEnrichmentMeta | null;
      propertyType?: string | null;
      subjectLocation?: MapCoordinate | null;
    }) => {
      setSubject(data.subject);
      setSubjectEnrichment(data.subjectEnrichment ?? null);
      setManualFields(new Set());
      if (data.propertyType) {
        setPropertyType((prev) => prev || data.propertyType!);
      }
      if (data.subjectLocation) {
        setSubjectLocation(data.subjectLocation);
      }
    },
    [],
  );

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
        applyPrefillData(data.data);
        lastPrefilledKeyRef.current = addressKey;
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
        applyPrefillData({
          subject: cached.subject,
          subjectEnrichment: cached.subjectEnrichment,
          propertyType: cached.propertyType,
          subjectLocation: cached.subjectLocation,
        });
        setFromCache(true);
        setError('');
        onCompleteRef.current?.(cached);
        return;
      }
      const latest = findLatestCmaCache<CmaAnalysisResult>(addressKey);
      if (latest) {
        setResult(latest);
        applyPrefillData({
          subject: latest.subject,
          subjectEnrichment: latest.subjectEnrichment,
          propertyType: latest.propertyType,
          subjectLocation: latest.subjectLocation,
        });
        setFromCache(true);
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
        applyPrefillData({
          subject: data.data.subject,
          subjectEnrichment: data.data.subjectEnrichment,
          propertyType: data.data.propertyType,
          subjectLocation: data.data.subjectLocation,
        });
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
  }, [street, city, state, zip, propertyType, radius, yearsBack, subject, manualFields, applyPrefillData]);

  useEffect(() => {
    if (
      initialResult &&
      cmaMatchesFields(initialResult, street, city, state, zip) &&
      !isRunningRef.current &&
      !loading
    ) {
      setResult(initialResult);
      applyPrefillData({
        subject: initialResult.subject,
        subjectEnrichment: initialResult.subjectEnrichment,
        propertyType: initialResult.propertyType,
        subjectLocation: initialResult.subjectLocation,
      });
      setFromCache(true);
      setRadius(initialResult.radius ?? 0.5);
      setYearsBack(initialResult.yearsBack ?? 1);
      setError('');
      setExcludedIds(new Set());
      setShowAllComps(false);
      lastPrefilledKeyRef.current = addressKey;
      return;
    }

    if (prevAddressKeyRef.current !== addressKey) {
      prevAddressKeyRef.current = addressKey;
      lastPrefilledKeyRef.current = null;
      if (!isRunningRef.current && !loading) {
        setSubject(defaultSubject());
        setSubjectLocation(null);
        setSubjectEnrichment(null);
        setManualFields(new Set());
        setResult(null);
        setFromCache(false);
        setError('');
        setExcludedIds(new Set());
        setShowAllComps(false);
      }
    }
  }, [street, city, state, zip, initialResult, loading, addressKey, applyPrefillData]);

  useEffect(() => {
    if (!street.trim() || !state) return;
    if (lastPrefilledKeyRef.current === addressKey) return;
    if (initialResult && cmaMatchesFields(initialResult, street, city, state, zip)) return;

    let cancelled = false;

    const person = lookupData?.found && lookupData.results?.[0] ? lookupData.results[0] : null;
    if (person) {
      const fromLookup = subjectFromLookupPerson(person);
      if (!cancelled) {
        setSubject(fromLookup.subject);
        if (fromLookup.propertyType) setPropertyType(fromLookup.propertyType);
        if (fromLookup.subjectLocation) setSubjectLocation(fromLookup.subjectLocation);
      }
    }

    (async () => {
      setPrefilling(true);
      setError('');
      try {
        const res = await fetch('/api/market-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload(true)),
        });
        const data = await res.json();
        if (!cancelled && data.success) {
          applyPrefillData(data.data);
          lastPrefilledKeyRef.current = addressKey;
        }
      } catch {
        if (!cancelled && !person) {
          setError('Could not load property details.');
        }
      } finally {
        if (!cancelled) setPrefilling(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefill when address or lookup changes
  }, [addressKey, lookupData]);

  useEffect(() => {
    if (!result) setParamsExpanded(true);
  }, [result]);

  useEffect(() => {
    if (prevLoadingRef.current && !loading && result) {
      setParamsExpanded(false);
    }
    prevLoadingRef.current = loading;
  }, [loading, result]);

  useEffect(() => {
    if (result && !loading) {
      setParamsExpanded(false);
    }
  }, [addressKey]);

  useEffect(() => {
    if (runTrigger <= 0 || runTrigger === lastTriggerRef.current) return;
    lastTriggerRef.current = runTrigger;

    const runWithPrefill = async () => {
      if (lastPrefilledKeyRef.current !== addressKey && street.trim() && state) {
        await handlePrefill();
      }
      runAnalysis();
    };

    void runWithPrefill();
  }, [runTrigger, runAnalysis, addressKey, street, state]);

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

  const handleResetParams = () => {
    setRadius(CMA_DEFAULT_RADIUS);
    setYearsBack(CMA_DEFAULT_YEARS_BACK);
    setPropertyType('');
  };

  const mapHasCompPins =
    Boolean(result) &&
    activeComps.some((c) => c.latitude !== null && c.longitude !== null);

  const mapAddress = result?.address ?? formattedAddress;
  const hasResults = Boolean(result && !loading && liveValuation);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(300px,380px)_minmax(0,1fr)] lg:items-stretch lg:gap-5">
        {/* Left: subject, params, results, actions */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-[10px] border border-gray-150 bg-gray-50/50">
          {hasResults && liveValuation && (
            <div className="shrink-0 border-b border-gray-150 bg-[var(--surface)] px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-600">
                    Suggested list price
                  </p>
                  {liveValuation.suggestedPrice ? (
                    <>
                      <p className="mt-0.5 text-[26px] font-bold leading-tight text-gray-900">
                        {fmt(liveValuation.suggestedPrice, '$')}
                      </p>
                      <p className="mt-0.5 text-[12px] text-gray-600">
                        {fmt(liveValuation.priceLow, '$')} – {fmt(liveValuation.priceHigh, '$')} ·{' '}
                        {liveValuation.compCount} comp{liveValuation.compCount !== 1 ? 's' : ''}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-[13px] text-gray-600">
                      Not enough comps — widen radius or sold-within range.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="inline-flex shrink-0 items-center gap-1 rounded-[8px] border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50"
                >
                  {exportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  PDF
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 space-y-4 overflow-y-auto p-4 lg:max-h-[calc(100vh-220px)]">
            {!hasResults && (
              <>
                <CmaSubjectSummary
                  address={mapAddress}
                  subject={subject}
                  subjectEnrichment={subjectEnrichment}
                  manualFields={manualFields}
                  prefilling={prefilling}
                  canPrefill={Boolean(street.trim() && state)}
                  onPrefill={handlePrefill}
                  onUpdateSubject={updateSubject}
                />

                <CmaSearchParams
                  radius={radius}
                  yearsBack={yearsBack}
                  propertyType={propertyType}
                  onRadiusChange={setRadius}
                  onYearsBackChange={setYearsBack}
                  onPropertyTypeChange={setPropertyType}
                />
              </>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-[10px] border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {loading && (
              <DataLoadingState
                title="Running comp-based analysis"
                description="Scoring nearby sales and adjusting for beds, baths, and condition."
              />
            )}

            {hasResults && liveValuation && result && (
              <div className="space-y-4">
                {paramsExpanded && (
                  <>
                    <CmaSearchParams
                      radius={radius}
                      yearsBack={yearsBack}
                      propertyType={propertyType}
                      onRadiusChange={setRadius}
                      onYearsBackChange={setYearsBack}
                      onPropertyTypeChange={setPropertyType}
                    />
                    <CmaSubjectSummary
                      address={mapAddress}
                      subject={subject}
                      subjectEnrichment={subjectEnrichment}
                      manualFields={manualFields}
                      prefilling={prefilling}
                      canPrefill={Boolean(street.trim() && state)}
                      onPrefill={handlePrefill}
                      onUpdateSubject={updateSubject}
                    />
                    <button
                      type="button"
                      onClick={() => setParamsExpanded(false)}
                      className="w-full rounded-[10px] border border-gray-200 py-2 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Done editing search
                    </button>
                  </>
                )}

                {result.isDemo && (
                  <div className="rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2.5 text-[12.5px] text-gray-600">
                    Sample marketing CMA — fictional comps for demo.
                  </div>
                )}
                {fromCache && !result.isDemo && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12.5px] text-emerald-800">
                    <span>Loaded from cache — no API usage.</span>
                    <button
                      type="button"
                      onClick={() => runAnalysis(true)}
                      className="font-medium text-emerald-700 underline hover:text-emerald-900"
                    >
                      Refresh live
                    </button>
                  </div>
                )}

                {result.activeListing && (
                  <div className="flex items-start gap-2 rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-800">
                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Currently listed</p>
                      <p className="mt-0.5 text-amber-700">
                        {fmt(result.activeListing.price, '$')}
                        {result.activeListing.mlsNumber && ` · MLS #${result.activeListing.mlsNumber}`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-[10px] border border-gray-200 bg-[var(--surface)] p-3">
                    <p className="text-[11px] text-gray-600">AVM</p>
                    <p className="mt-0.5 text-[15px] font-bold text-gray-800">
                      {result.avm?.estimatedValue ? fmt(result.avm.estimatedValue, '$') : '—'}
                    </p>
                  </div>
                  <div className="rounded-[10px] border border-gray-200 bg-[var(--surface)] p-3">
                    <p className="text-[11px] text-gray-600">Rent est.</p>
                    <p className="mt-0.5 text-[15px] font-bold text-gray-900">
                      {result.rentEstimate?.monthlyRent ? `${fmt(result.rentEstimate.monthlyRent, '$')}/mo` : '—'}
                    </p>
                  </div>
                </div>

                {result.summary && (
                  <div className="rounded-[10px] border border-gray-200 bg-[var(--surface)] p-3">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-gray-700" />
                      <p className="text-[11px] font-medium text-gray-600">Market summary</p>
                    </div>
                    <p className="text-[12.5px] leading-relaxed text-gray-600">{result.summary}</p>
                  </div>
                )}

                <div>
                  <p className="mb-2 text-[12px] font-medium text-gray-600">
                    Comparable sales
                    {result.compsFiltered > 0 && (
                      <span className="font-normal text-gray-500">
                        {' '}
                        · {result.compsFiltered} removed
                      </span>
                    )}
                  </p>
                  {activeComps.length === 0 ? (
                    <p className="text-[13px] text-gray-600">No comps available.</p>
                  ) : (
                    <div className="max-h-64 space-y-2 overflow-y-auto pr-0.5">
                      {visibleComps.map((comp) => {
                        const realIdx = result.comps.indexOf(comp);
                        const conditionedAdj = comp.adjustedPrice
                          ? Math.round(comp.adjustedPrice * liveValuation.conditionFactor)
                          : null;
                        return (
                          <div key={realIdx} className="rounded-[10px] border border-gray-150 bg-[var(--surface)] p-3">
                            <div className="mb-1.5 flex items-start justify-between gap-2">
                              <p className="text-[12.5px] font-medium text-gray-900">{comp.address}</p>
                              <div className="flex shrink-0 items-center gap-1.5">
                                <div className="text-right">
                                  <p className="text-[12.5px] font-bold text-gray-900">{fmt(comp.price, '$')}</p>
                                  {conditionedAdj && (
                                    <p className="text-[10px] text-gray-600">Adj. {fmt(conditionedAdj, '$')}</p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setExcludedIds((prev) => new Set([...prev, realIdx]))}
                                  className="p-0.5 text-gray-400 hover:text-rose-500"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-[11px] text-gray-600">
                              {comp.bedrooms !== null && <span>{comp.bedrooms} bd</span>}
                              {comp.bathrooms !== null && <span>{comp.bathrooms} ba</span>}
                              {comp.squareFootage !== null && (
                                <span>{comp.squareFootage.toLocaleString()} sqft</span>
                              )}
                              {comp.soldDate && <span>Sold {fmtDate(comp.soldDate)}</span>}
                            </div>
                          </div>
                        );
                      })}
                      {activeComps.length > 5 && (
                        <button
                          type="button"
                          onClick={() => setShowAllComps((v) => !v)}
                          className="w-full rounded-[10px] border border-gray-200 py-2 text-[12px] text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          {showAllComps ? 'Show fewer' : `Show all ${activeComps.length} comps`}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {!paramsExpanded && (
                  <>
                    <CmaSubjectSummary
                      address={mapAddress}
                      subject={subject}
                      subjectEnrichment={subjectEnrichment}
                      manualFields={manualFields}
                      prefilling={prefilling}
                      canPrefill={Boolean(street.trim() && state)}
                      onPrefill={handlePrefill}
                      onUpdateSubject={updateSubject}
                    />
                    <CmaSearchParams
                      radius={radius}
                      yearsBack={yearsBack}
                      propertyType={propertyType}
                      onRadiusChange={setRadius}
                      onYearsBackChange={setYearsBack}
                      onPropertyTypeChange={setPropertyType}
                      collapsed
                      onExpand={() => setParamsExpanded(true)}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 border-t border-gray-150 bg-[var(--surface)] p-3">
            <button
              type="button"
              onClick={handleResetParams}
              className="rounded-[10px] px-3 py-2 text-[12.5px] font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Reset defaults
            </button>
            <button
              type="button"
              onClick={() => runAnalysis()}
              disabled={loading || !street.trim() || !state}
              className="ml-auto flex flex-1 items-center justify-center gap-2 rounded-[10px] bg-brand-500 py-2.5 text-[13px] font-semibold text-[var(--brand-foreground)] transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-6"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Running…
                </>
              ) : result ? (
                <>
                  <TrendingUp className="h-4 w-4" /> Re-run comps
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" /> Find comps
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: live map */}
        <div className="flex min-h-[320px] flex-col overflow-hidden rounded-[10px] border border-gray-150 bg-[var(--surface)] p-3 lg:min-h-[calc(100vh-220px)]">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block size-2.5 rounded-full bg-[#0668E1] border border-white" />
              Subject
            </span>
            {mapHasCompPins && (
              <span className="inline-flex items-center gap-1">
                <span className="inline-block size-2 rounded-full bg-[#1C1D22] border border-white" />
                Comp
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full border border-[#0668E1]/55 bg-[#0668E1]/10" />
              {radius} mi
            </span>
            <span className="text-[10px] text-gray-400 lg:ml-auto">© Mapbox © OpenStreetMap</span>
          </div>
          <div className="relative min-h-0 flex-1">
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[10px] bg-[var(--surface)]/80 backdrop-blur-[1px]">
                <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
              </div>
            )}
            {hasResults && liveValuation?.suggestedPrice && (
              <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[220px] rounded-[10px] border border-gray-200 bg-white/95 px-3 py-2.5 shadow-md backdrop-blur-sm">
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-600">Suggested list</p>
                <p className="text-[18px] font-bold leading-tight text-gray-900">
                  {fmt(liveValuation.suggestedPrice, '$')}
                </p>
                <p className="text-[11px] text-gray-600">
                  {fmt(liveValuation.priceLow, '$')} – {fmt(liveValuation.priceHigh, '$')}
                </p>
              </div>
            )}
            <CmaCompsMap
              mode={mapHasCompPins ? 'results' : 'preview'}
              subjectLocation={mapSubjectLocation}
              comps={mapHasCompPins ? activeComps : []}
              radiusMiles={radius}
              subjectAddress={mapAddress}
              hideLegend
              mapHeightClassName="h-full min-h-[280px] lg:min-h-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

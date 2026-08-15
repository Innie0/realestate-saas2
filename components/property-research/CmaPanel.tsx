'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  defaultSubject,
  recalculateValuation,
  valueFromSelectedComps,
  type ScoredComp,
  type SubjectProperty,
} from '@/lib/cma';
import { useToast } from '@/components/providers/ToastProvider';
import DataLoadingState from '@/components/dashboard/DataLoadingState';
import CmaSubjectSummary from '@/components/property-research/CmaSubjectSummary';
import CmaPropertyDashboard from '@/components/property-research/CmaPropertyDashboard';
import CmaCompCard from '@/components/property-research/CmaCompCard';
import type { CmaSubjectProfile } from '@/lib/subject-profile';
import type { ExcludedCompSummary } from '@/lib/comp-filters';
import { normalizeAddress } from '@/lib/comp-filters';
import {
  assessCmaConfidence,
  shouldShowAddCompForm,
  type CmaConfidence,
} from '@/lib/cma-confidence';
import CmaConfidenceBanner from '@/components/property-research/CmaConfidenceBanner';
import CmaAddCompForm from '@/components/property-research/CmaAddCompForm';
import CmaSearchParams, {
  CMA_DEFAULT_RADIUS,
  CMA_DEFAULT_YEARS_BACK,
} from '@/components/property-research/CmaSearchParams';
import CmaAdvancedSearchParams from '@/components/property-research/CmaAdvancedSearchParams';
import {
  defaultSearchCriteriaFromSubject,
  MIN_COMPS_FOR_STRICT_SEARCH,
  type CmaSearchCriteria,
} from '@/lib/cma-search-criteria';
import {
  Loader2, AlertCircle,
  TrendingUp,
  Download, Info, ArrowLeft, Home,
} from 'lucide-react';
import Link from 'next/link';
import { propertyResearchLandingHref } from '@/lib/property-research-routes';
import { buildCmaPdfPayload, downloadCmaPdf } from '@/lib/export-cma-pdf';
import { normalizeAddressKey } from '@/lib/property-research-cache';
import { normalizeCmaResult, CMA_RESULT_VERSION } from '@/lib/cma-result-format';
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
    <div className="h-[320px] w-full animate-pulse rounded-[10px] border border-gray-200 bg-gray-100" />
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
  resultVersion?: number;
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
  excludedComps?: ExcludedCompSummary[];
  compStats?: {
    fetched: number;
    validSold: number;
    activeComps?: number;
    afterSimilarity: number;
    afterCriteria?: number;
    widenedSearch: boolean;
    radiusUsed: number;
    daysOldUsed: number;
  };
  searchCriteria?: CmaSearchCriteria;
  includeActiveListings?: boolean;
  criteriaRelaxed?: boolean;
  criteriaMatchCount?: number;
  subjectProfile?: CmaSubjectProfile | null;
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
  compSelectionNote?: string | null;
  compSelectionAiUsed?: boolean;
  cmaConfidence?: CmaConfidence | null;
  summary: string | null;
  isDemo?: boolean;
  queriedAt: string;
}

function fmt(n: number | null | undefined, prefix = '', suffix = '') {
  if (n === null || n === undefined) return '—';
  return `${prefix}${n.toLocaleString()}${suffix}`;
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
  const [includeActiveListings, setIncludeActiveListings] = useState(true);
  const [subject, setSubject] = useState<SubjectProperty>(defaultSubject());
  const [subjectLocation, setSubjectLocation] = useState<MapCoordinate | null>(null);
  const [subjectEnrichment, setSubjectEnrichment] = useState<SubjectEnrichmentMeta | null>(null);
  const [manualFields, setManualFields] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CmaAnalysisResult | null>(null);
  const [excludedIds, setExcludedIds] = useState<Set<number>>(new Set());
  const [valuationOverrides, setValuationOverrides] = useState<Map<number, boolean>>(new Map());
  const [manualComps, setManualComps] = useState<ScoredComp[]>([]);
  const [showExcludedComps, setShowExcludedComps] = useState(false);
  const [showAllComps, setShowAllComps] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [fromCache, setFromCache] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState<CmaSearchCriteria>(
    defaultSearchCriteriaFromSubject(defaultSubject()),
  );
  const [matchPreviewCount, setMatchPreviewCount] = useState<number | null>(null);
  const [matchPreviewLoading, setMatchPreviewLoading] = useState(false);
  const [mapAreaMode, setMapAreaMode] = useState<'radius' | 'custom'>('radius');
  const [customAreaPoints, setCustomAreaPoints] = useState<MapCoordinate[]>([]);
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

  const buildPayload = (prefillOnly = false, forceRefresh = false, matchPreview = false) => ({
    street: street.trim(),
    city: city.trim(),
    state,
    zip: zip.trim(),
    propertyType: propertyType || undefined,
    radius,
    yearsBack,
    prefillOnly,
    forceRefresh,
    matchPreview,
    searchCriteria,
    includeActiveListings,
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
      setSearchCriteria(defaultSearchCriteriaFromSubject(data.subject));
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

  const applyCachedResult = useCallback(
    (cached: CmaAnalysisResult, localKey: string) => {
      const normalized = normalizeCmaResult(cached);
      setResult(normalized);
      applyPrefillData({
        subject: normalized.subject,
        subjectEnrichment: normalized.subjectEnrichment,
        propertyType: normalized.propertyType,
        subjectLocation: normalized.subjectLocation,
      });
      setFromCache(true);
      if (normalized.resultVersion !== cached.resultVersion) {
        setLocalResearchCache(localKey, normalized);
      }
      setError('');
      onCompleteRef.current?.(normalized);
    },
    [applyPrefillData],
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
      searchCriteria,
      includeActiveListings,
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
        applyCachedResult(cached, localKey);
        return;
      }
      const latest = findLatestCmaCache<CmaAnalysisResult>(addressKey);
      if (latest) {
        const normalized = normalizeCmaResult(latest);
        setResult(normalized);
        applyPrefillData({
          subject: normalized.subject,
          subjectEnrichment: normalized.subjectEnrichment,
          propertyType: normalized.propertyType,
          subjectLocation: normalized.subjectLocation,
        });
        setFromCache(true);
        if (normalized.searchCriteria) {
          setSearchCriteria(normalized.searchCriteria);
        }
        if (normalized.includeActiveListings !== undefined) {
          setIncludeActiveListings(normalized.includeActiveListings);
        }
        setRadius(normalized.radius ?? 0.5);
        setYearsBack(normalized.yearsBack ?? 1);
        setLocalResearchCache(localKey, normalized);
        setError('');
        onCompleteRef.current?.(normalized);
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
    setValuationOverrides(new Map());
    setManualComps([]);
    setShowExcludedComps(false);

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
        const normalized = normalizeCmaResult(data.data);
        setResult(normalized);
        applyPrefillData({
          subject: normalized.subject,
          subjectEnrichment: normalized.subjectEnrichment,
          propertyType: normalized.propertyType,
          subjectLocation: normalized.subjectLocation,
        });
        setFromCache(!!data.fromCache);
        if (normalized.searchCriteria) {
          setSearchCriteria(normalized.searchCriteria);
        }
        if (normalized.includeActiveListings !== undefined) {
          setIncludeActiveListings(normalized.includeActiveListings);
        }
        setLocalResearchCache(localKey, normalized);
        onCompleteRef.current?.(normalized);
        toast.success('CMA analysis complete');
      }
    } catch {
      setError('Something went wrong. Please try again.');
      onCompleteRef.current?.(null);
    } finally {
      isRunningRef.current = false;
      setLoading(false);
    }
  }, [street, city, state, zip, propertyType, radius, yearsBack, subject, manualFields, searchCriteria, includeActiveListings, applyPrefillData, applyCachedResult]);

  useEffect(() => {
    if (
      initialResult &&
      cmaMatchesFields(initialResult, street, city, state, zip) &&
      !isRunningRef.current &&
      !loading
    ) {
      setResult(normalizeCmaResult(initialResult));
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
    setValuationOverrides(new Map());
    setManualComps([]);
    setShowExcludedComps(false);
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
        setSearchCriteria(defaultSearchCriteriaFromSubject(defaultSubject()));
        setMatchPreviewCount(null);
        setManualFields(new Set());
        setResult(null);
        setFromCache(false);
        setError('');
        setExcludedIds(new Set());
    setValuationOverrides(new Map());
    setManualComps([]);
    setShowExcludedComps(false);
        setShowAllComps(false);
        setMapAreaMode('radius');
        setCustomAreaPoints([]);
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
    if (!street.trim() || !state) {
      setMatchPreviewCount(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setMatchPreviewLoading(true);
      try {
        const res = await fetch('/api/market-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload(false, false, true)),
        });
        const data = await res.json();
        if (!cancelled && data.success) {
          setMatchPreviewCount(
            typeof data.data?.matchCount === 'number' ? data.data.matchCount : null,
          );
        }
      } catch {
        if (!cancelled) setMatchPreviewCount(null);
      } finally {
        if (!cancelled) setMatchPreviewLoading(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- debounced preview on search inputs
  }, [addressKey, radius, yearsBack, propertyType, searchCriteria, includeActiveListings, subject]);

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

  const mergedComps = useMemo(() => {
    if (!result) return [];
    const seen = new Set(result.comps.map((c) => normalizeAddress(c.address)).filter(Boolean));
    const extras = manualComps.filter((c) => {
      const key = normalizeAddress(c.address);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return [...result.comps, ...extras];
  }, [result, manualComps]);

  const activeCompEntries = useMemo((): { realIdx: number; comp: ScoredComp }[] => {
    if (!result) return [];
    const entries: { realIdx: number; comp: ScoredComp }[] = [];
    for (let realIdx = 0; realIdx < mergedComps.length; realIdx += 1) {
      if (excludedIds.has(realIdx)) continue;
      const comp = mergedComps[realIdx];
      const override = valuationOverrides.get(realIdx);
      entries.push({
        realIdx,
        comp: {
          ...comp,
          selectedForValuation:
            override !== undefined ? override : Boolean(comp.selectedForValuation),
        },
      });
    }
    return entries;
  }, [result, mergedComps, excludedIds, valuationOverrides]);

  const activeComps = useMemo(
    () => activeCompEntries.map((e) => e.comp),
    [activeCompEntries],
  );

  const toggleCompValuation = useCallback((realIdx: number) => {
    setValuationOverrides((prev) => {
      const next = new Map(prev);
      const comp = mergedComps[realIdx];
      if (!comp) return prev;
      const current = next.has(realIdx) ? next.get(realIdx)! : Boolean(comp.selectedForValuation);
      next.set(realIdx, !current);
      return next;
    });
  }, [mergedComps]);

  const handleCompAdded = useCallback((comp: ScoredComp) => {
    setManualComps((prev) => {
      const key = normalizeAddress(comp.address);
      if (key && prev.some((c) => normalizeAddress(c.address) === key)) return prev;
      return [...prev, { ...comp, selectedForValuation: true, manuallyAdded: true }];
    });
    toast.success('Comp added to analysis');
  }, [toast]);

  const sortedActiveCompEntries = useMemo(() => {
    const selected = activeCompEntries.filter((e) => e.comp.selectedForValuation);
    const others = activeCompEntries.filter((e) => !e.comp.selectedForValuation);
    return selected.length > 0 ? [...selected, ...others] : activeCompEntries;
  }, [activeCompEntries]);

  const liveValuation = useMemo(() => {
    if (!result) return null;
    const usesSelectedCompValuation =
      result.resultVersion === CMA_RESULT_VERSION ||
      activeComps.some((c) => c.selectedForValuation === true);
    if (usesSelectedCompValuation) {
      const { valuation } = valueFromSelectedComps(result.subject, activeComps);
      return valuation;
    }
    return recalculateValuation(result.subject, activeComps, result.valuation.medianPricePerSqft);
  }, [result, activeComps]);

  const visibleCompEntries = showAllComps
    ? sortedActiveCompEntries
    : sortedActiveCompEntries.slice(0, 5);

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
    setIncludeActiveListings(true);
    setSearchCriteria(defaultSearchCriteriaFromSubject(subject));
    setMapAreaMode('radius');
    setCustomAreaPoints([]);
  };

  const mapSelectionProps = {
    areaMode: mapAreaMode,
    onAreaModeChange: setMapAreaMode,
    customPoints: customAreaPoints,
    onCustomPointsChange: setCustomAreaPoints,
  };

  const criteriaTooFew =
    matchPreviewCount !== null && matchPreviewCount < MIN_COMPS_FOR_STRICT_SEARCH;

  const mapHasCompPins =
    Boolean(result) &&
    activeComps.some((c) => c.latitude !== null && c.longitude !== null);

  const mapAddress = result?.address ?? formattedAddress;
  const hasResults = Boolean(result && !loading && liveValuation);

  const valuationCompsForConfidence = useMemo(
    () => activeComps.filter((c) => c.selectedForValuation),
    [activeComps],
  );

  const liveConfidence = useMemo(
    () =>
      assessCmaConfidence({
        valuationComps: valuationCompsForConfidence,
        suggestedPrice: liveValuation?.suggestedPrice ?? null,
        avmPrice: result?.avm?.estimatedValue ?? null,
        afterSimilarity: result?.compStats?.afterSimilarity ?? valuationCompsForConfidence.length,
        validSold: result?.compStats?.validSold ?? mergedComps.length,
        conditionFactor: liveValuation?.conditionFactor ?? 1,
      }),
    [valuationCompsForConfidence, liveValuation, result, mergedComps.length],
  );

  const renderControlsPanel = () => (
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
        includeActiveListings={includeActiveListings}
        onRadiusChange={setRadius}
        onYearsBackChange={setYearsBack}
        onPropertyTypeChange={setPropertyType}
        onIncludeActiveListingsChange={setIncludeActiveListings}
        breezyLayout
      />
      <CmaAdvancedSearchParams
        subject={subject}
        criteria={searchCriteria}
        onChange={setSearchCriteria}
        matchPreviewCount={matchPreviewCount}
        matchPreviewLoading={matchPreviewLoading}
        breezyLayout
      />
    </>
  );

  const renderCriteriaBanner = () => {
    if (criteriaTooFew && !loading) {
      return (
        <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-800">
          Only {matchPreviewCount} sale{matchPreviewCount !== 1 ? 's' : ''} match your filters. Widen
          sqft range or relax bed/bath limits before running the CMA.
        </div>
      );
    }
    return null;
  };

  const renderActionBar = () => (
    <div className="flex items-center justify-between gap-3">
      <button
        type="button"
        onClick={handleResetParams}
        className="text-[13px] font-medium text-gray-600 underline-offset-2 transition-colors hover:text-gray-900 dark:text-muted-foreground dark:hover:text-foreground"
      >
        Reset to default
      </button>
      <button
        type="button"
        onClick={() => runAnalysis(!!result)}
        disabled={loading || !street.trim() || !state}
        className="inline-flex min-w-[148px] items-center justify-center gap-2 rounded-full bg-gray-900 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-foreground dark:text-background dark:hover:opacity-90"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Running…
          </>
        ) : result ? (
          <>
            <TrendingUp className="h-4 w-4" /> Re-run CMA
          </>
        ) : matchPreviewLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Counting…
          </>
        ) : (
          <>Find {matchPreviewCount !== null ? matchPreviewCount : '…'} comps</>
        )}
      </button>
    </div>
  );

  const renderCompList = () => {
    if (!hasResults || !liveValuation || !result) return null;

    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-gray-900">Comparable sales</p>
          {valuationCompsForConfidence.length > 0 && (
            <p className="text-[11.5px] text-gray-500">
              {valuationCompsForConfidence.length} used in valuation
            </p>
          )}
        </div>

        {shouldShowAddCompForm(liveConfidence) && (
          <div className="mb-3">
            <CmaAddCompForm
              subjectAddress={result.address}
              subject={subject}
              activeListingAddresses={
                result.activeListing?.address ? [result.activeListing.address] : []
              }
              onCompAdded={handleCompAdded}
              fallbackMode
            />
          </div>
        )}

        {activeComps.length === 0 ? (
          <p className="text-[13px] text-gray-600">No comps available.</p>
        ) : (
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
            {visibleCompEntries.map(({ comp, realIdx }) => {
              const impliedAtSubject =
                comp.pricePerSqft && subject.squareFootage
                  ? Math.round(
                      comp.pricePerSqft * subject.squareFootage * liveValuation.conditionFactor,
                    )
                  : null;
              const conditionedAdj =
                impliedAtSubject ??
                (comp.adjustedPrice
                  ? Math.round(comp.adjustedPrice * liveValuation.conditionFactor)
                  : null);
              return (
                <CmaCompCard
                  key={realIdx}
                  comp={comp}
                  conditionedAdj={conditionedAdj}
                  selectedForValuation={comp.selectedForValuation === true}
                  onToggleValuation={() => toggleCompValuation(realIdx)}
                  onExclude={() => setExcludedIds((prev) => new Set([...prev, realIdx]))}
                />
              );
            })}
            {activeComps.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllComps((v) => !v)}
                className="w-full rounded-[10px] border border-gray-200 py-2 text-[12.5px] text-gray-700 transition-colors hover:bg-gray-50"
              >
                {showAllComps ? 'Show fewer' : `Show all ${activeComps.length} comps`}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderResultsMeta = () => {
    if (!hasResults || !liveValuation || !result) return null;

    return (
      <div className="space-y-3 border-t border-gray-150 pt-3">
        {result.isDemo && (
          <div className="rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2.5 text-[12.5px] text-gray-600">
            Sample marketing CMA — fictional demo data.
          </div>
        )}
        {fromCache && !result.isDemo && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-[12.5px] text-emerald-800">
            <span>Cached results</span>
            <button
              type="button"
              onClick={() => runAnalysis(true)}
              className="font-medium text-emerald-700 underline hover:text-emerald-900"
            >
              Refresh live
            </button>
          </div>
        )}

        {result.compSelectionNote && (
          <p className="rounded-[10px] border border-blue-100 bg-blue-50/80 px-3 py-2 text-[12.5px] leading-relaxed text-gray-700">
            {result.compSelectionNote}
          </p>
        )}

        <CmaConfidenceBanner
          valuationComps={valuationCompsForConfidence}
          suggestedPrice={liveValuation.suggestedPrice}
          avmPrice={result.avm?.estimatedValue ?? null}
          afterSimilarity={result.compStats?.afterSimilarity ?? valuationCompsForConfidence.length}
          validSold={result.compStats?.validSold ?? mergedComps.length}
          conditionFactor={liveValuation.conditionFactor}
          initial={result.cmaConfidence}
        />

        <CmaPropertyDashboard
          address={result.address}
          subject={subject}
          subjectProfile={result.subjectProfile}
          suggestedPrice={liveValuation.suggestedPrice}
          priceLow={liveValuation.priceLow}
          priceHigh={liveValuation.priceHigh}
          avmValue={result.avm?.estimatedValue ?? null}
          rentMonthly={result.rentEstimate?.monthlyRent ?? null}
          activeListPrice={result.activeListing?.price ?? null}
          compCount={liveValuation.compCount}
          showSuggestedPrice={false}
        />

        {result.compStats && (
          <p className="text-[11.5px] text-gray-600">
            {result.compStats.fetched} fetched · {result.compStats.validSold} closed
            {(result.compStats.activeComps ?? 0) > 0
              ? ` · ${result.compStats.activeComps} active`
              : ''}{' '}
            · {result.compStats.afterCriteria ?? result.compStats.afterSimilarity} match filters
            {result.compStats.widenedSearch ? ` · widened to ${result.compStats.radiusUsed} mi` : ''}
          </p>
        )}

        {result.activeListing && (
          <div className="flex items-start gap-2 rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12.5px] text-amber-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Currently listed</p>
              <p className="mt-0.5 text-[11.5px] text-amber-700">
                {fmt(result.activeListing.price, '$')}
                {result.activeListing.mlsNumber && ` · MLS #${result.activeListing.mlsNumber}`}
              </p>
            </div>
          </div>
        )}

        {(result.excludedComps?.length ?? 0) > 0 && (
          <div className="rounded-[10px] border border-gray-200 bg-[var(--surface)]">
            <button
              type="button"
              onClick={() => setShowExcludedComps((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left text-[12.5px] font-medium text-gray-700 hover:bg-gray-50"
            >
              <span>{result.excludedComps!.length} excluded sale{result.excludedComps!.length !== 1 ? 's' : ''}</span>
              <span className="text-[11px] text-gray-500">{showExcludedComps ? 'Hide' : 'Show'}</span>
            </button>
            {showExcludedComps && (
              <div className="max-h-36 space-y-2 overflow-y-auto border-t border-gray-150 px-3 py-2">
                {result.excludedComps!.map((row) => (
                  <div key={row.address} className="text-[11.5px]">
                    <p className="font-medium text-gray-800">{row.address}</p>
                    <p className="text-gray-600">{row.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[10px] border border-gray-200 bg-[var(--surface)] px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">AVM</p>
            <p className="mt-0.5 text-[14px] font-semibold text-gray-900">
              {result.avm?.estimatedValue ? fmt(result.avm.estimatedValue, '$') : '—'}
            </p>
          </div>
          <div className="rounded-[10px] border border-gray-200 bg-[var(--surface)] px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Rent est.</p>
            <p className="mt-0.5 text-[14px] font-semibold text-gray-900">
              {result.rentEstimate?.monthlyRent
                ? `${fmt(result.rentEstimate.monthlyRent, '$')}/mo`
                : '—'}
            </p>
          </div>
        </div>

        {result.summary && (
          <div className="rounded-[10px] border border-gray-200 bg-[var(--surface)] px-3 py-2.5">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Market summary
            </p>
            <p className="text-[12.5px] leading-relaxed text-gray-600">{result.summary}</p>
          </div>
        )}
      </div>
    );
  };

  const renderResultsHeader = () => {
    if (!hasResults || !liveValuation || !result) return null;

    return (
      <div className="rounded-xl border border-gray-200 bg-[var(--surface)] p-4 dark:border-border">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Suggested list price</p>
            {liveValuation.suggestedPrice ? (
              <>
                <p className="text-[24px] font-bold leading-tight text-gray-900 dark:text-foreground">
                  {fmt(liveValuation.suggestedPrice, '$')}
                  {liveConfidence.thinMarket && (
                    <span className="ml-2 text-[13px] font-normal text-amber-700">estimate</span>
                  )}
                </p>
                <p className="text-[12.5px] text-gray-600 dark:text-muted-foreground">
                  {fmt(liveValuation.priceLow, '$')} – {fmt(liveValuation.priceHigh, '$')} ·{' '}
                  {liveValuation.compCount} comp{liveValuation.compCount !== 1 ? 's' : ''}
                </p>
              </>
            ) : (
              <p className="text-[13px] text-gray-600">Not enough comps — widen search settings.</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exportingPdf || !liveValuation.suggestedPrice}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-[var(--surface)] px-3 py-2 text-[12.5px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-border"
          >
            {exportingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export PDF
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="relative flex shrink-0 items-center border-b border-gray-200/80 px-4 py-3 dark:border-border sm:px-6">
        <Link
          href={propertyResearchLandingHref()}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-muted-foreground dark:hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          New search
        </Link>
        <div className="pointer-events-none absolute left-1/2 top-1/2 hidden max-w-[min(560px,calc(100%-8rem))] -translate-x-1/2 -translate-y-1/2 sm:block">
          <div className="flex items-center gap-2.5 rounded-full border border-gray-200/90 bg-[var(--surface)] px-4 py-2 shadow-sm dark:border-border">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-muted">
              <Home className="size-4" />
            </span>
            <span className="truncate text-[13px] font-medium text-gray-900 dark:text-foreground">{mapAddress}</span>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden flex-col lg:flex-row">
        <aside className="flex min-h-0 w-full shrink-0 flex-col overflow-hidden border-b border-gray-200/80 bg-gray-50/40 dark:border-border dark:bg-muted/20 lg:h-full lg:max-h-full lg:w-[380px] lg:border-b-0 lg:border-r">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5">
            <p className="truncate text-[14px] font-semibold text-gray-900 sm:hidden dark:text-foreground">{mapAddress}</p>
            <div className="relative h-[240px] shrink-0 overflow-hidden rounded-2xl lg:hidden">
              <CmaCompsMap
                mode={mapHasCompPins ? 'results' : 'preview'}
                subjectLocation={mapSubjectLocation}
                comps={mapHasCompPins ? activeComps : []}
                radiusMiles={radius}
                subjectAddress={mapAddress}
                hideLegend
                fillContainer
                {...mapSelectionProps}
              />
            </div>
            {renderControlsPanel()}
            {renderCriteriaBanner()}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            {hasResults && (
              <div className="space-y-4 border-t border-gray-200/80 pt-4 dark:border-border">
                {renderResultsHeader()}
                {renderResultsMeta()}
                {renderCompList()}
              </div>
            )}
          </div>
          <div className="shrink-0 border-t border-gray-200/80 bg-[var(--surface)] p-4 sm:p-5 dark:border-border">
            {renderActionBar()}
          </div>
        </aside>

        <main className="relative hidden min-h-0 flex-1 overflow-hidden px-4 pb-4 pt-0 lg:block">
          <CmaCompsMap
            mode={mapHasCompPins ? 'results' : 'preview'}
            subjectLocation={mapSubjectLocation}
            comps={mapHasCompPins ? activeComps : []}
            radiusMiles={radius}
            subjectAddress={mapAddress}
            hideLegend
            fillContainer
            {...mapSelectionProps}
          />
        </main>
      </div>

      {loading && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 border-t border-gray-200/80 bg-[var(--surface)]/95 p-4 backdrop-blur-sm dark:border-border">
          <DataLoadingState
            title="Running comp-based analysis"
            description="Scoring nearby sales and adjusting for beds, baths, and condition. This usually takes 10–20 seconds."
          />
        </div>
      )}
    </div>
  );
}

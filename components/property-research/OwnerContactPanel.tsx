'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, Phone, Mail, Home, Building, Loader2, AlertCircle, ChevronDown, ChevronUp, Shield, Copy, Check, X, Calendar, DollarSign, Ruler, Bed, Bath, FileText, TrendingUp, Tag, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { normalizeAddressKey } from '@/lib/property-research-cache';
import { isDemoMarketingAddress } from '@/lib/demo-property-research';
import {
  getLocalResearchCache,
  lookupLocalCacheKey,
  setLocalResearchCache,
} from '@/lib/research-local-cache';

// Types for property lookup results
interface PhoneNumber {
  number: string;
  rawNumber: string;
  type: string;
  carrier: string;
  tested: boolean;
  reachable: boolean;
  score: string;
  tcpa: boolean;
  dnc: boolean;
}

interface EmailAddress {
  email: string;
}

interface SaleHistoryEntry {
  date: string | null;
  price: number | null;
}

interface PropertyDetails {
  yearBuilt: string | number | null;
  squareFootage: string | number | null;
  bedrooms: string | number | null;
  bathrooms: string | number | null;
  lotSize: string | number | null;
  assessedValue: string | number | null;
  landValue: string | number | null;
  improvementValue: string | number | null;
  lastSaleDate: string | null;
  lastSalePrice: string | number | null;
  legalDescription: string | null;
  ownerName: string | null;
  ownerAddress: string | null;
  propertyType: string | null;
  subdivision: string | null;
  zoning: string | null;
  hoaFee: number | null;
  features: Record<string, unknown> | null;
  saleHistory: SaleHistoryEntry[];
}

interface ListingInfo {
  status: string;
  price: number | null;
  listedDate: string | null;
  daysOnMarket: number | null;
  listingType: string | null;
  mlsNumber: string | null;
  listingAgent: {
    name: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
  } | null;
  listingOffice: {
    name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
}

interface PropertyResult {
  owner: {
    firstName: string;
    lastName: string;
    fullName: string;
    type?: string;
  };
  dataSource?: string;
  propertyAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    county: string;
    latitude: number | null;
    longitude: number | null;
    formatted: string;
  };
  mailingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    formatted: string;
  };
  occupancyStatus: string;
  phoneNumbers: PhoneNumber[];
  emails: EmailAddress[];
  isLitigator: boolean;
  bankruptcy: Record<string, unknown>;
  dnc: Record<string, unknown>;
  involuntaryLien: Record<string, unknown>;
  matched: boolean;
  propertyDetails: PropertyDetails | null;
  activeListing: ListingInfo | null;
  recentlySold: ListingInfo | null;
}

export interface LookupResponse {
  found: boolean;
  isDemo?: boolean;
  message?: string;
  results?: PropertyResult[];
  searchedAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  meta?: {
    requestCount: number;
    matchCount: number;
  };
}

export interface OwnerContactPanelProps {
  street: string;
  city: string;
  state: string;
  zip: string;
  lookupTrigger?: number;
  /** Parent-held lookup data (e.g. from recent history cache) */
  initialData?: LookupResponse | null;
  onComplete?: (data: LookupResponse | null) => void;
  onLoadingChange?: (loading: boolean) => void;
}

function lookupMatchesFields(
  data: LookupResponse,
  street: string,
  city: string,
  state: string,
  zip: string
): boolean {
  const current = normalizeAddressKey({
    street: street.trim(),
    city: city.trim(),
    state,
    zip: zip.trim(),
  });
  const searched = normalizeAddressKey({
    street: data.searchedAddress.street,
    city: data.searchedAddress.city,
    state: data.searchedAddress.state,
    zip: data.searchedAddress.zip,
  });
  return current === searched;
}

export function OwnerContactPanel({
  street,
  city,
  state,
  zip,
  lookupTrigger = 0,
  initialData = null,
  onComplete,
  onLoadingChange,
}: OwnerContactPanelProps) {
  const [results, setResults] = useState<LookupResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPersonIndex, setExpandedPersonIndex] = useState<number | null>(0);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const isFetchingRef = useRef(false);
  const lastTriggerRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const runLookup = useCallback(async (forceRefresh = false) => {
    if (isFetchingRef.current) return;

    setError(null);
    setExpandedPersonIndex(0);

    if (!street.trim()) {
      setError('Please enter a street address');
      onCompleteRef.current?.(null);
      return;
    }
    if (!state) {
      setError('Please select a state');
      onCompleteRef.current?.(null);
      return;
    }
    if (!city.trim() && !zip.trim()) {
      setError('Please enter either a city or ZIP code');
      onCompleteRef.current?.(null);
      return;
    }

    const addressKey = normalizeAddressKey({
      street: street.trim(),
      city: city.trim(),
      state,
      zip: zip.trim(),
    });
    const localKey = lookupLocalCacheKey(addressKey);
    const isDemo = isDemoMarketingAddress({
      street: street.trim(),
      city: city.trim(),
      state,
      zip: zip.trim(),
    });

    if (!forceRefresh && !isDemo) {
      const cached = getLocalResearchCache<LookupResponse>(localKey);
      if (cached) {
        setResults(cached);
        setFromCache(true);
        onCompleteRef.current?.(cached);
        return;
      }
    }

    setResults(null);
    setFromCache(false);
    isFetchingRef.current = true;
    setIsLoading(true);
    try {
      const response = await fetch('/api/property-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          street: street.trim(),
          city: city.trim(),
          state,
          zip: zip.trim(),
          forceRefresh,
        }),
      });
      const data = await response.json();
      if (!data.success) {
        setError(data.error || 'Failed to look up property');
        onCompleteRef.current?.(null);
        return;
      }
      setResults(data.data);
      setFromCache(!!data.fromCache);
      setLocalResearchCache(localKey, data.data);
      onCompleteRef.current?.(data.data);
    } catch (err) {
      console.error('Property lookup error:', err);
      setError('An unexpected error occurred. Please try again.');
      onCompleteRef.current?.(null);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [street, city, state, zip]);

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  useEffect(() => {
    if (lookupTrigger <= 0 || lookupTrigger === lastTriggerRef.current) return;
    lastTriggerRef.current = lookupTrigger;
    runLookup();
  }, [lookupTrigger, runLookup]);

  // Hydrate from parent cache when selecting a recent search (no new API call)
  useEffect(() => {
    if (isFetchingRef.current || isLoading) return;

    if (initialData && lookupMatchesFields(initialData, street, city, state, zip)) {
      setResults(initialData);
      setFromCache(true);
      setError(null);
      return;
    }

    if (results && !lookupMatchesFields(results, street, city, state, zip)) {
      setResults(null);
      setFromCache(false);
      setError(null);
    }
  }, [initialData, street, city, state, zip, isLoading, results]);

  // Get occupancy status badge color
  const getOccupancyColor = (status: string) => {
    if (status.includes('Owner-Occupied')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status.includes('Absentee') || status.includes('Rental')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-700">
          <Loader2 className="w-5 h-5 animate-spin" />
          Pulling property records and owner contact info — usually 5–10 seconds on first lookup.
        </div>
      )}

      {results?.isDemo && !isLoading && (
        <div className="mb-4 rounded-[10px] border border-gray-200 bg-gray-50 px-4 py-3 text-[13px] text-gray-600">
          Sample marketing data — owner contact and property details are fictional for demo purposes.
        </div>
      )}
      {fromCache && results && !isLoading && !results.isDemo && (
        <div className="flex items-center justify-between gap-3 flex-wrap text-sm bg-emerald-50 border border-emerald-200 rounded-[10px] px-4 py-3">
          <span className="text-emerald-800">Loaded from saved search — no API usage.</span>
          <button
            type="button"
            onClick={() => runLookup(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 underline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh live data
          </button>
        </div>
      )}

      {/* Error Message */}
        {error && (
          <div className="mb-8 flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-[10px]">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-rose-700 font-medium">Lookup Failed</p>
              <p className="text-rose-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* No Results */}
        {results && !results.found && (
          <div className="mb-8 flex items-start gap-3 p-6 bg-amber-50 border border-amber-200 rounded-[10px]">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 font-medium">No Records Found</p>
              <p className="text-amber-700 text-sm mt-1">
                {results.message || 'No property records were found for this address. Please double-check the address and try again.'}
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {results && results.found && results.results && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-gray-900">
                Results for {results.searchedAddress.street}
              </h2>
              <span className="text-[12.5px] text-gray-600">
                {results.meta?.matchCount || results.results.length} record(s) found
              </span>
            </div>

            {/* Person Cards */}
            {results.results.map((person, index) => (
              <div
                key={index}
                className="rounded-[10px] overflow-hidden border border-gray-200 transition-all duration-200 hover:border-gray-300 bg-[var(--surface)]"
              >
                {/* Card Header - Always Visible */}
                <button
                  onClick={() => setExpandedPersonIndex(expandedPersonIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    {(() => {
                      const isUnknown = !person.owner.firstName && !person.owner.lastName;
                      const initial = person.owner.firstName?.[0]?.toUpperCase() || person.owner.lastName?.[0]?.toUpperCase();
                      return (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-[16px] flex-shrink-0 border ${isUnknown ? 'bg-gray-50 border-gray-200 text-gray-600' : 'bg-[var(--surface)] border-gray-300 text-gray-900'}`}>
                          {isUnknown ? '?' : initial}
                        </div>
                      );
                    })()}
                    <div className="text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Owner name — handle "Not Found" case gracefully */}
                        {(() => {
                          const raw = person.owner.fullName || '';
                          const isNotFound = raw.toLowerCase().includes('not found') || raw.toLowerCase().includes('unknown');
                          const fallback = person.propertyDetails?.ownerName;
                          const displayName = isNotFound
                            ? (fallback ? fallback : 'Unknown Owner')
                            : raw;
                          return (
                            <h3 className={`font-semibold text-lg capitalize ${isNotFound && !fallback ? 'text-gray-700 italic' : 'text-gray-900'}`}>
                              {displayName}
                            </h3>
                          );
                        })()}

                        {/* Owner confidence badge */}
                        {(() => {
                          const src = person.dataSource;
                          if (src === 'county_records_and_skip_trace' && person.matched) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Shield className="w-3 h-3" /> Confirmed Owner
                              </span>
                            );
                          }
                          if (src === 'county_records_only') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
                                <Shield className="w-3 h-3" /> County Record
                              </span>
                            );
                          }
                          if (src === 'skip_trace_only') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                <Shield className="w-3 h-3" /> Likely Owner
                              </span>
                            );
                          }
                          if (src === 'county_records_and_skip_trace') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
                                <Shield className="w-3 h-3" /> County Verified
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getOccupancyColor(person.occupancyStatus)}`}>
                          {person.occupancyStatus === 'Owner-Occupied' ? (
                            <Home className="w-3 h-3 mr-1" />
                          ) : (
                            <Building className="w-3 h-3 mr-1" />
                          )}
                          {person.occupancyStatus}
                        </span>
                        {person.owner.type && person.owner.type !== 'Unknown' && (
                          <span className="text-xs text-gray-700">{person.owner.type}</span>
                        )}
                        {person.phoneNumbers.length > 0 && (
                          <span className="text-xs text-gray-700">
                            {person.phoneNumbers.length} phone(s)
                          </span>
                        )}
                        {person.emails.length > 0 && (
                          <span className="text-xs text-gray-700">
                            {person.emails.length} email(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {expandedPersonIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-700" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-700" />
                  )}
                </button>

                {/* Recently Sold Banner — always visible when inactive MLS listing exists */}
                {!person.activeListing && person.recentlySold && (
                  <div className="mx-4 mb-3 flex items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-[10px]">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-700 flex-shrink-0" />
                      <div>
                        <span className="text-gray-900 font-semibold text-sm">Recently Sold</span>
                        {person.recentlySold.price && (
                          <span className="text-gray-900 font-bold text-sm ml-2">
                            Listed at ${person.recentlySold.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-700 flex-shrink-0">
                      {person.recentlySold.daysOnMarket !== null && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {person.recentlySold.daysOnMarket}d on market
                        </span>
                      )}
                      {person.recentlySold.listedDate && (
                        <span>Listed {person.recentlySold.listedDate}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* For Sale Banner — always visible when active listing exists */}
                {person.activeListing && (
                  <div className="mx-4 mb-3 flex items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-200 rounded-[10px]">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <div>
                        <span className="text-amber-800 font-semibold text-sm">Currently For Sale</span>
                        {person.activeListing.price && (
                          <span className="text-amber-800 font-bold text-sm ml-2">
                            ${person.activeListing.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-700 flex-shrink-0">
                      {person.activeListing.daysOnMarket !== null && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {person.activeListing.daysOnMarket}d on market
                        </span>
                      )}
                      {person.activeListing.listedDate && (
                        <span>Listed {person.activeListing.listedDate}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Expanded Details */}
                {expandedPersonIndex === index && (
                  <div className="border-t border-gray-200 p-5 space-y-6">
                    {/* Addresses Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Property Address */}
                      <div className="bg-gray-50 rounded-[10px] p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Home className="w-4 h-4 text-gray-600" />
                          <h4 className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-gray-600">Property Address</h4>
                        </div>
                        <p className="text-gray-900 text-sm">
                          {person.propertyAddress.formatted || 'N/A'}
                        </p>
                        {person.propertyAddress.county && (
                          <p className="text-gray-700 text-xs mt-1">
                            County: {person.propertyAddress.county}
                          </p>
                        )}
                      </div>

                      {/* Owner Mailing Address */}
                      <div className="bg-gray-50 rounded-[10px] p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4 text-gray-600" />
                          <h4 className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-gray-600">Owner Mailing Address</h4>
                        </div>
                        <p className="text-gray-900 text-sm">
                          {person.mailingAddress.formatted || 'Same as property'}
                        </p>
                        {person.occupancyStatus.includes('Absentee') && (
                          <p className="text-amber-400 text-xs mt-1">
                            Different from property address (likely rental)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Property Details from RapidAPI */}
                    {person.propertyDetails && Object.values(person.propertyDetails).some(v => v !== null) && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Home className="w-4 h-4 text-gray-600" />
                          <h4 className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-gray-600">Property Details</h4>
                        </div>
                        {/* Key specs row — beds/baths/sqft/year front and center */}
                        {(person.propertyDetails.bedrooms || person.propertyDetails.bathrooms || person.propertyDetails.squareFootage || person.propertyDetails.yearBuilt) && (
                          <div className="flex flex-wrap gap-4 mb-4 p-4 bg-gray-50 rounded-[10px] border border-gray-200">
                            {person.propertyDetails.bedrooms && (
                              <div className="flex items-center gap-2">
                                <Bed className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                <div>
                                  <p className="text-lg font-bold text-gray-900 leading-none">{person.propertyDetails.bedrooms}</p>
                                  <p className="text-xs text-gray-700">beds</p>
                                </div>
                              </div>
                            )}
                            {person.propertyDetails.bedrooms && person.propertyDetails.bathrooms && <div className="w-px bg-gray-100" />}
                            {person.propertyDetails.bathrooms && (
                              <div className="flex items-center gap-2">
                                <Bath className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                <div>
                                  <p className="text-lg font-bold text-gray-900 leading-none">{person.propertyDetails.bathrooms}</p>
                                  <p className="text-xs text-gray-700">baths</p>
                                </div>
                              </div>
                            )}
                            {person.propertyDetails.squareFootage && <div className="w-px bg-gray-100" />}
                            {person.propertyDetails.squareFootage && (
                              <div className="flex items-center gap-2">
                                <Ruler className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                <div>
                                  <p className="text-lg font-bold text-gray-900 leading-none">{Number(person.propertyDetails.squareFootage).toLocaleString()}</p>
                                  <p className="text-xs text-gray-700">sq ft</p>
                                </div>
                              </div>
                            )}
                            {person.propertyDetails.yearBuilt && <div className="w-px bg-gray-100" />}
                            {person.propertyDetails.yearBuilt && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-600 flex-shrink-0" />
                                <div>
                                  <p className="text-lg font-bold text-gray-900 leading-none">{person.propertyDetails.yearBuilt}</p>
                                  <p className="text-xs text-gray-700">built</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Secondary details grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {person.propertyDetails.lotSize && (
                            <div className="bg-gray-50 rounded-[10px] p-3 flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-700">Lot Size</p>
                                <p className="text-gray-900 text-sm font-medium">{person.propertyDetails.lotSize}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.propertyType && (
                            <div className="bg-gray-50 rounded-[10px] p-3 flex items-start gap-2">
                              <Building className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-700">Property Type</p>
                                <p className="text-gray-900 text-sm font-medium">{person.propertyDetails.propertyType}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.assessedValue && (
                            <div className="bg-gray-50 rounded-[10px] p-3 flex items-start gap-2">
                              <DollarSign className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-700">Assessed Value</p>
                                <p className="text-gray-900 text-sm font-medium">${Number(person.propertyDetails.assessedValue).toLocaleString()}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.lastSalePrice && (
                            <div className="bg-gray-50 rounded-[10px] p-3 flex items-start gap-2">
                              <DollarSign className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-700">Last Sale Price</p>
                                <p className="text-gray-900 text-sm font-medium">${Number(person.propertyDetails.lastSalePrice).toLocaleString()}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.lastSaleDate && (
                            <div className="bg-gray-50 rounded-[10px] p-3 flex items-start gap-2">
                              <Calendar className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-700">Last Sale Date</p>
                                <p className="text-gray-900 text-sm font-medium">{person.propertyDetails.lastSaleDate}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.subdivision && (
                            <div className="bg-gray-50 rounded-[10px] p-3 flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-700">Subdivision</p>
                                <p className="text-gray-900 text-sm font-medium">{person.propertyDetails.subdivision}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.hoaFee && (
                            <div className="bg-gray-50 rounded-[10px] p-3 flex items-start gap-2">
                              <DollarSign className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-700">HOA Fee</p>
                                <p className="text-gray-900 text-sm font-medium">${person.propertyDetails.hoaFee}/mo</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.zoning && (
                            <div className="bg-gray-50 rounded-[10px] p-3 flex items-start gap-2">
                              <FileText className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-700">Zoning</p>
                                <p className="text-gray-900 text-sm font-medium">{person.propertyDetails.zoning}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.legalDescription && (
                            <div className="bg-gray-50 rounded-[10px] p-3 flex items-start gap-2 col-span-2 sm:col-span-3">
                              <FileText className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-700">Legal Description</p>
                                <p className="text-gray-900 text-sm">{person.propertyDetails.legalDescription}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Phone Numbers Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Phone className="w-4 h-4 text-gray-600" />
                        <h4 className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-gray-600">
                          Phone Numbers ({person.phoneNumbers.length})
                        </h4>
                      </div>

                      {person.phoneNumbers.length === 0 ? (
                        <p className="text-gray-700 text-sm bg-gray-50 rounded-[10px] p-4">
                          No phone numbers found for this person.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {person.phoneNumbers.map((phone, phoneIndex) => (
                            <div
                              key={phoneIndex}
                              className="flex items-center justify-between bg-gray-50 rounded-[10px] p-3 group hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                  <Phone className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                  <p className="text-gray-900 font-medium text-sm">
                                    {phone.number}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-gray-700">{phone.type}</span>
                                    {phone.carrier !== 'Unknown' && (
                                      <span className="text-xs text-gray-600">{phone.carrier}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  {phone.tested && phone.reachable && (
                                    <span className="text-xs text-emerald-600">Reachable</span>
                                  )}
                                  {phone.tested && !phone.reachable && (
                                    <span className="text-xs text-rose-600">Not Reachable</span>
                                  )}
                                  {phone.dnc && (
                                    <span className="text-xs text-amber-700">DNC</span>
                                  )}
                                </div>
                                {/* Copy button */}
                                <button
                                  onClick={() => copyToClipboard(phone.rawNumber)}
                                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Copy number"
                                >
                                  {copiedText === phone.rawNumber ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-gray-700" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Emails Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Mail className="w-4 h-4 text-gray-600" />
                        <h4 className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-gray-600">
                          Email Addresses ({person.emails.length})
                        </h4>
                      </div>

                      {person.emails.length === 0 ? (
                        <p className="text-gray-700 text-sm bg-gray-50 rounded-[10px] p-4">
                          No email addresses found for this person.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {person.emails.map((email, emailIndex) => (
                            <div
                              key={emailIndex}
                              className="flex items-center justify-between bg-gray-50 rounded-[10px] p-3 group hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                  <Mail className="w-4 h-4 text-gray-600" />
                                </div>
                                <p className="text-gray-900 text-sm">{email.email}</p>
                              </div>
                              <button
                                onClick={() => copyToClipboard(email.email)}
                                className="p-2 rounded-lg hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                                title="Copy email"
                              >
                                {copiedText === email.email ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-700" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Warnings/Flags */}
                    {person.isLitigator && (
                      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-[10px]">
                        <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-amber-800 text-sm font-medium">
                          This person is flagged as a TCPA litigator. Exercise caution when making contact.
                        </p>
                      </div>
                    )}

                    {/* Active Listing Details */}
                    {person.activeListing && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Tag className="w-4 h-4 text-gray-600" />
                          <h4 className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-gray-600">Listing Details</h4>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-[10px] p-4 space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {person.activeListing.price && (
                              <div>
                                <p className="text-xs text-gray-700">Asking Price</p>
                                <p className="text-gray-900 font-bold">${person.activeListing.price.toLocaleString()}</p>
                              </div>
                            )}
                            {person.activeListing.daysOnMarket !== null && (
                              <div>
                                <p className="text-xs text-gray-700">Days on Market</p>
                                <p className="text-gray-900 font-semibold">{person.activeListing.daysOnMarket} days</p>
                              </div>
                            )}
                            {person.activeListing.listedDate && (
                              <div>
                                <p className="text-xs text-gray-700">Listed Date</p>
                                <p className="text-gray-900 font-semibold">{person.activeListing.listedDate}</p>
                              </div>
                            )}
                            {person.activeListing.mlsNumber && (
                              <div>
                                <p className="text-xs text-gray-700">MLS #</p>
                                <p className="text-gray-900 font-semibold">{person.activeListing.mlsNumber}</p>
                              </div>
                            )}
                          </div>
                          {person.activeListing.listingAgent && (
                            <div className="pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-700 mb-1">Listing Agent</p>
                              <p className="text-gray-900 text-sm font-medium">{person.activeListing.listingAgent.name}</p>
                              <div className="flex flex-wrap gap-3 mt-1">
                                {person.activeListing.listingAgent.phone && (
                                  <span className="text-xs text-gray-700 flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {person.activeListing.listingAgent.phone}
                                  </span>
                                )}
                                {person.activeListing.listingAgent.email && (
                                  <span className="text-xs text-gray-700 flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {person.activeListing.listingAgent.email}
                                  </span>
                                )}
                                {person.activeListing.listingAgent.website && (
                                  <a
                                    href={person.activeListing.listingAgent.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-gray-700 hover:text-gray-900 flex items-center gap-1 hover:underline transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Website
                                  </a>
                                )}
                              </div>
                              {person.activeListing.listingOffice?.name && (
                                <p className="text-xs text-gray-700 mt-1">{person.activeListing.listingOffice.name}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Recently Sold MLS Details */}
                    {!person.activeListing && person.recentlySold && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-gray-600" />
                          <h4 className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-gray-600">Recently Sold (MLS)</h4>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-[10px] p-4 space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {person.recentlySold.price && (
                              <div>
                                <p className="text-xs text-gray-700">Listed Price</p>
                                <p className="text-gray-900 font-bold">${person.recentlySold.price.toLocaleString()}</p>
                              </div>
                            )}
                            {person.recentlySold.daysOnMarket !== null && (
                              <div>
                                <p className="text-xs text-gray-700">Days on Market</p>
                                <p className="text-gray-900 font-semibold">{person.recentlySold.daysOnMarket} days</p>
                              </div>
                            )}
                            {person.recentlySold.listedDate && (
                              <div>
                                <p className="text-xs text-gray-700">Listed Date</p>
                                <p className="text-gray-900 font-semibold">{person.recentlySold.listedDate}</p>
                              </div>
                            )}
                            {person.recentlySold.mlsNumber && (
                              <div>
                                <p className="text-xs text-gray-700">MLS #</p>
                                <p className="text-gray-900 font-semibold">{person.recentlySold.mlsNumber}</p>
                              </div>
                            )}
                          </div>
                          {person.recentlySold.listingAgent && (
                            <div className="pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-700 mb-1">Listing Agent</p>
                              <p className="text-gray-900 text-sm font-medium">{person.recentlySold.listingAgent.name}</p>
                              <div className="flex flex-wrap gap-3 mt-1">
                                {person.recentlySold.listingAgent.phone && (
                                  <span className="text-xs text-gray-700 flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {person.recentlySold.listingAgent.phone}
                                  </span>
                                )}
                                {person.recentlySold.listingAgent.email && (
                                  <span className="text-xs text-gray-700 flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {person.recentlySold.listingAgent.email}
                                  </span>
                                )}
                                {person.recentlySold.listingAgent.website && (
                                  <a
                                    href={person.recentlySold.listingAgent.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-gray-700 hover:text-gray-900 flex items-center gap-1 hover:underline transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Website
                                  </a>
                                )}
                              </div>
                              {person.recentlySold.listingOffice?.name && (
                                <p className="text-xs text-gray-700 mt-1">{person.recentlySold.listingOffice.name}</p>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-gray-600 italic pt-1">
                            Listed price may differ from the final recorded sale price shown in Sale History below.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Sale History — Zillow-style */}
                    {person.propertyDetails?.saleHistory && person.propertyDetails.saleHistory.length > 0 && (() => {
                      const history = person.propertyDetails!.saleHistory;
                      const prices = history.map(s => s.price).filter((p): p is number => p !== null && p > 0);
                      const maxPrice = prices.length > 0 ? Math.max(...prices) : 1;

                      return (
                        <div>
                          {/* Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-gray-700" />
                              <h4 className="text-sm font-semibold text-gray-900">Price History</h4>
                            </div>
                            <span className="text-xs text-gray-700">{history.length} recorded sale{history.length !== 1 ? 's' : ''}</span>
                          </div>

                          {/* Chart + timeline */}
                          <div className="rounded-[10px] border border-gray-200 overflow-hidden">
                            {/* Mini bar chart */}
                            {prices.length > 1 && (
                              <div className="px-4 pt-4 pb-2 border-b border-gray-200">
                                <p className="text-xs text-gray-700 mb-3">Sale price over time (oldest → newest)</p>
                                <div className="flex items-end gap-1.5 h-16">
                                  {[...history].reverse().map((sale, i) => {
                                    const pct = sale.price && maxPrice > 0 ? (sale.price / maxPrice) * 100 : 0;
                                    const isLatest = i === history.length - 1;
                                    return (
                                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                          <div className="bg-gray-100 border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-900 whitespace-nowrap shadow-xl">
                                            {sale.date && <p className="text-gray-700">{sale.date}</p>}
                                            <p className="font-semibold">{sale.price ? `$${sale.price.toLocaleString()}` : 'Unknown'}</p>
                                          </div>
                                        </div>
                                        <div
                                          className={`w-full rounded-t transition-all ${isLatest ? 'bg-gray-900' : 'bg-gray-300'}`}
                                          style={{ height: `${Math.max(pct, 8)}%` }}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Timeline rows */}
                            <div className="divide-y divide-gray-200">
                              {history.map((sale, saleIndex) => {
                                const nextSale = history[saleIndex + 1]; // older sale
                                let changeStr = '';
                                let changePos = false;
                                if (sale.price && nextSale?.price) {
                                  const diff = sale.price - nextSale.price;
                                  const pct = ((diff / nextSale.price) * 100).toFixed(1);
                                  changePos = diff >= 0;
                                  changeStr = `${diff >= 0 ? '+' : ''}${pct}%`;
                                }

                                return (
                                  <div key={saleIndex} className={`flex items-center justify-between px-4 py-3 ${saleIndex === 0 ? 'bg-gray-50' : 'hover:bg-gray-50'} transition-colors`}>
                                    {/* Left: dot + date */}
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="flex flex-col items-center flex-shrink-0">
                                        <div className={`w-2.5 h-2.5 rounded-full ${saleIndex === 0 ? 'bg-gray-900' : 'bg-gray-300'}`} />
                                        {saleIndex < history.length - 1 && (
                                          <div className="w-px h-6 bg-gray-100 mt-0.5" />
                                        )}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-sm text-gray-900 font-medium">
                                            {sale.date || 'Unknown date'}
                                          </span>
                                          {saleIndex === 0 && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                              Most Recent
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-xs text-gray-700">Recorded sale</span>
                                      </div>
                                    </div>

                                    {/* Right: price + change */}
                                    <div className="text-right flex-shrink-0 ml-4">
                                      <p className="text-gray-900 font-bold text-sm">
                                        {sale.price ? `$${sale.price.toLocaleString()}` : '—'}
                                      </p>
                                      {changeStr && (
                                        <p className={`text-xs font-medium ${changePos ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          {changeStr} from prev
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Appreciation summary */}
                          {prices.length >= 2 && (() => {
                            const newest = prices[0];
                            const oldest = prices[prices.length - 1];
                            const totalPct = (((newest - oldest) / oldest) * 100).toFixed(1);
                            const isUp = newest >= oldest;
                            return (
                              <div className={`mt-3 flex items-center gap-3 p-3 rounded-[10px] border ${isUp ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                                <TrendingUp className={`w-4 h-4 flex-shrink-0 ${isUp ? 'text-emerald-600' : 'text-rose-600'}`} />
                                <p className="text-sm text-gray-600">
                                  Total appreciation:{' '}
                                  <span className={`font-semibold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {isUp ? '+' : ''}{totalPct}%
                                  </span>
                                  {' '}from ${oldest.toLocaleString()} → ${newest.toLocaleString()}
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })()}

                    {/* Disclaimer */}
                    <p className="text-xs text-gray-600 italic">
                      Disclaimer: Some information displayed may be inaccurate or outdated. Owner data is sourced from county public records and may not reflect recent ownership changes. Phone numbers and emails are sourced from third-party databases and are not guaranteed to be current or correct. Always verify information before making contact.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      {!isLoading && !results && !error && (
        <p className="text-[13px] text-gray-600 text-center py-8">
          Run a search from the form above to find owner contact info and property records.
        </p>
      )}
    </div>
  );
}

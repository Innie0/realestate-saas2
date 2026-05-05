'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Search, MapPin, Phone, Mail, Home, Building, Loader2, AlertCircle, ChevronDown, ChevronUp, Shield, Copy, Check, X, Calendar, DollarSign, Ruler, Bed, Bath, FileText, TrendingUp, Tag, Clock, ExternalLink } from 'lucide-react';

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

interface LookupResponse {
  found: boolean;
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

// US States for the dropdown
const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
];

export default function PropertyLookupPage() {
  // Form state
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  // Results state
  const [results, setResults] = useState<LookupResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [expandedPersonIndex, setExpandedPersonIndex] = useState<number | null>(0);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Set page title
  useEffect(() => {
    document.title = 'Property Lookup - Realestic';
  }, []);

  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Handle form submission
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResults(null);
    setExpandedPersonIndex(0);

    if (!street.trim()) {
      setError('Please enter a street address');
      return;
    }

    if (!state) {
      setError('Please select a state');
      return;
    }

    if (!city.trim() && !zip.trim()) {
      setError('Please enter either a city or ZIP code');
      return;
    }

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
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to look up property');
        return;
      }

      setResults(data.data);

      // Add to search history
      const searchStr = `${street.trim()}, ${city.trim()}, ${state} ${zip.trim()}`.trim();
      setSearchHistory(prev => {
        const updated = [searchStr, ...prev.filter(s => s !== searchStr)].slice(0, 10);
        return updated;
      });

    } catch (err) {
      console.error('Property lookup error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear form
  const clearForm = () => {
    setStreet('');
    setCity('');
    setState('');
    setZip('');
    setResults(null);
    setError(null);
  };

  // Get occupancy status badge color
  const getOccupancyColor = (status: string) => {
    if (status.includes('Owner-Occupied')) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (status.includes('Absentee') || status.includes('Rental')) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="min-h-screen">
      <Header title="Property Lookup" subtitle="Search any address to find owner and contact information" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Form */}
        <div className="rounded-2xl border border-white/10 p-6 mb-8 bg-[#111111]">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Street Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Street Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. 123 Main Street"
                  className="w-full pl-10 pr-4 py-3 bg-[#111111] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
              </div>
            </div>

            {/* City, State, ZIP Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Los Angeles"
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  State <span className="text-red-400">*</span>
                </label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-[#111111]">Select State</option>
                  {US_STATES.map((s) => (
                    <option key={s.value} value={s.value} className="bg-[#111111]">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ZIP */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="e.g. 90001"
                  className="w-full px-4 py-3 bg-[#111111] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              <span className="text-red-400">*</span> Required: Street address and state. City and ZIP code are optional but help improve accuracy.
            </p>
            <p className="text-xs text-gray-600 italic">
              Disclaimer: Some information displayed may be inaccurate or outdated. Owner data is sourced from county public records and may not reflect recent ownership changes. Phone numbers and emails are sourced from third-party databases and are not guaranteed to be current or correct. Always verify information before making contact.
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-white text-gray-900 hover:bg-gray-50 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border border-gray-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Look Up Property
                  </>
                )}
              </button>

              {(street || city || state || zip) && (
                <button
                  type="button"
                  onClick={clearForm}
                  className="flex items-center gap-2 px-4 py-3 bg-[#111111] hover:bg-white/10 text-gray-300 font-medium rounded-xl transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-medium">Lookup Failed</p>
              <p className="text-red-400/80 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* No Results */}
        {results && !results.found && (
          <div className="mb-8 flex items-start gap-3 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-300 font-medium">No Records Found</p>
              <p className="text-yellow-400/80 text-sm mt-1">
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
              <h2 className="text-lg font-semibold text-white">
                Results for {results.searchedAddress.street}
              </h2>
              <span className="text-sm text-gray-400">
                {results.meta?.matchCount || results.results.length} record(s) found
              </span>
            </div>

            {/* Person Cards */}
            {results.results.map((person, index) => (
              <div
                key={index}
                className="rounded-2xl overflow-hidden border border-white/10 transition-all duration-200 hover:border-white/20 bg-[#111111]"
              >
                {/* Card Header - Always Visible */}
                <button
                  onClick={() => setExpandedPersonIndex(expandedPersonIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    {(() => {
                      const isUnknown = !person.owner.firstName && !person.owner.lastName;
                      const initial = person.owner.firstName?.[0]?.toUpperCase() || person.owner.lastName?.[0]?.toUpperCase();
                      return (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 border ${isUnknown ? 'bg-white/5 border-white/10 text-gray-500' : 'bg-white/10 border-white/20 text-white'}`}>
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
                            : raw.toLowerCase();
                          return (
                            <h3 className={`font-semibold text-lg capitalize ${isNotFound && !fallback ? 'text-gray-400 italic' : 'text-white'}`}>
                              {displayName}
                            </h3>
                          );
                        })()}

                        {/* Owner confidence badge */}
                        {(() => {
                          const src = person.dataSource;
                          if (src === 'county_records_and_skip_trace' && person.matched) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/25">
                                <Shield className="w-3 h-3" /> Confirmed Owner
                              </span>
                            );
                          }
                          if (src === 'county_records_only') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-gray-300 border border-white/20">
                                <Shield className="w-3 h-3" /> County Record
                              </span>
                            );
                          }
                          if (src === 'skip_trace_only') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
                                <Shield className="w-3 h-3" /> Likely Owner
                              </span>
                            );
                          }
                          if (src === 'county_records_and_skip_trace') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-gray-300 border border-white/20">
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
                          <span className="text-xs text-gray-500">{person.owner.type}</span>
                        )}
                        {person.phoneNumbers.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {person.phoneNumbers.length} phone(s)
                          </span>
                        )}
                        {person.emails.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {person.emails.length} email(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {expandedPersonIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Recently Sold Banner — always visible when inactive MLS listing exists */}
                {!person.activeListing && person.recentlySold && (
                  <div className="mx-4 mb-3 flex items-center justify-between gap-3 p-3 bg-blue-500/10 border border-blue-500/25 rounded-xl">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <div>
                        <span className="text-blue-300 font-semibold text-sm">Recently Sold</span>
                        {person.recentlySold.price && (
                          <span className="text-blue-400 font-bold text-sm ml-2">
                            Listed at ${person.recentlySold.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
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
                  <div className="mx-4 mb-3 flex items-center justify-between gap-3 p-3 bg-green-500/10 border border-green-500/25 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <div>
                        <span className="text-green-300 font-semibold text-sm">Currently For Sale</span>
                        {person.activeListing.price && (
                          <span className="text-green-400 font-bold text-sm ml-2">
                            ${person.activeListing.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
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
                  <div className="border-t border-white/10 p-5 space-y-6">
                    {/* Addresses Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Property Address */}
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Home className="w-4 h-4 text-white/40" />
                          <h4 className="text-sm font-medium text-gray-300">Property Address</h4>
                        </div>
                        <p className="text-white text-sm">
                          {person.propertyAddress.formatted || 'N/A'}
                        </p>
                        {person.propertyAddress.county && (
                          <p className="text-gray-500 text-xs mt-1">
                            County: {person.propertyAddress.county}
                          </p>
                        )}
                      </div>

                      {/* Owner Mailing Address */}
                      <div className="bg-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4 text-white/40" />
                          <h4 className="text-sm font-medium text-gray-300">Owner Mailing Address</h4>
                        </div>
                        <p className="text-white text-sm">
                          {person.mailingAddress.formatted || 'Same as property'}
                        </p>
                        {person.occupancyStatus.includes('Absentee') && (
                          <p className="text-orange-400 text-xs mt-1">
                            Different from property address (likely rental)
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Property Details from RapidAPI */}
                    {person.propertyDetails && Object.values(person.propertyDetails).some(v => v !== null) && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Home className="w-4 h-4 text-white/40" />
                          <h4 className="text-sm font-medium text-gray-300">Property Details</h4>
                        </div>
                        {/* Key specs row — beds/baths/sqft/year front and center */}
                        {(person.propertyDetails.bedrooms || person.propertyDetails.bathrooms || person.propertyDetails.squareFootage || person.propertyDetails.yearBuilt) && (
                          <div className="flex flex-wrap gap-4 mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                            {person.propertyDetails.bedrooms && (
                              <div className="flex items-center gap-2">
                                <Bed className="w-4 h-4 text-white/40 flex-shrink-0" />
                                <div>
                                  <p className="text-lg font-bold text-white leading-none">{person.propertyDetails.bedrooms}</p>
                                  <p className="text-xs text-gray-500">beds</p>
                                </div>
                              </div>
                            )}
                            {person.propertyDetails.bedrooms && person.propertyDetails.bathrooms && <div className="w-px bg-white/10" />}
                            {person.propertyDetails.bathrooms && (
                              <div className="flex items-center gap-2">
                                <Bath className="w-4 h-4 text-white/40 flex-shrink-0" />
                                <div>
                                  <p className="text-lg font-bold text-white leading-none">{person.propertyDetails.bathrooms}</p>
                                  <p className="text-xs text-gray-500">baths</p>
                                </div>
                              </div>
                            )}
                            {person.propertyDetails.squareFootage && <div className="w-px bg-white/10" />}
                            {person.propertyDetails.squareFootage && (
                              <div className="flex items-center gap-2">
                                <Ruler className="w-4 h-4 text-white/40 flex-shrink-0" />
                                <div>
                                  <p className="text-lg font-bold text-white leading-none">{Number(person.propertyDetails.squareFootage).toLocaleString()}</p>
                                  <p className="text-xs text-gray-500">sq ft</p>
                                </div>
                              </div>
                            )}
                            {person.propertyDetails.yearBuilt && <div className="w-px bg-white/10" />}
                            {person.propertyDetails.yearBuilt && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-white/40 flex-shrink-0" />
                                <div>
                                  <p className="text-lg font-bold text-white leading-none">{person.propertyDetails.yearBuilt}</p>
                                  <p className="text-xs text-gray-500">built</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Secondary details grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {person.propertyDetails.lotSize && (
                            <div className="bg-white/5 rounded-xl p-3 flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Lot Size</p>
                                <p className="text-white text-sm font-medium">{person.propertyDetails.lotSize}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.propertyType && (
                            <div className="bg-white/5 rounded-xl p-3 flex items-start gap-2">
                              <Building className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Property Type</p>
                                <p className="text-white text-sm font-medium">{person.propertyDetails.propertyType}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.assessedValue && (
                            <div className="bg-white/5 rounded-xl p-3 flex items-start gap-2">
                              <DollarSign className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Assessed Value</p>
                                <p className="text-white text-sm font-medium">${Number(person.propertyDetails.assessedValue).toLocaleString()}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.lastSalePrice && (
                            <div className="bg-white/5 rounded-xl p-3 flex items-start gap-2">
                              <DollarSign className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Last Sale Price</p>
                                <p className="text-white text-sm font-medium">${Number(person.propertyDetails.lastSalePrice).toLocaleString()}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.lastSaleDate && (
                            <div className="bg-white/5 rounded-xl p-3 flex items-start gap-2">
                              <Calendar className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Last Sale Date</p>
                                <p className="text-white text-sm font-medium">{person.propertyDetails.lastSaleDate}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.subdivision && (
                            <div className="bg-white/5 rounded-xl p-3 flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Subdivision</p>
                                <p className="text-white text-sm font-medium">{person.propertyDetails.subdivision}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.hoaFee && (
                            <div className="bg-white/5 rounded-xl p-3 flex items-start gap-2">
                              <DollarSign className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">HOA Fee</p>
                                <p className="text-white text-sm font-medium">${person.propertyDetails.hoaFee}/mo</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.zoning && (
                            <div className="bg-white/5 rounded-xl p-3 flex items-start gap-2">
                              <FileText className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Zoning</p>
                                <p className="text-white text-sm font-medium">{person.propertyDetails.zoning}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.legalDescription && (
                            <div className="bg-white/5 rounded-xl p-3 flex items-start gap-2 col-span-2 sm:col-span-3">
                              <FileText className="w-4 h-4 text-white/40 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Legal Description</p>
                                <p className="text-white text-sm">{person.propertyDetails.legalDescription}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Phone Numbers Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Phone className="w-4 h-4 text-white/40" />
                        <h4 className="text-sm font-medium text-gray-300">
                          Phone Numbers ({person.phoneNumbers.length})
                        </h4>
                      </div>

                      {person.phoneNumbers.length === 0 ? (
                        <p className="text-gray-500 text-sm bg-white/5 rounded-xl p-4">
                          No phone numbers found for this person.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {person.phoneNumbers.map((phone, phoneIndex) => (
                            <div
                              key={phoneIndex}
                              className="flex items-center justify-between bg-white/5 rounded-xl p-3 group hover:bg-white/10 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                  <Phone className="w-4 h-4 text-white/40" />
                                </div>
                                <div>
                                  <p className="text-white font-medium text-sm">
                                    {phone.number}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-gray-500">{phone.type}</span>
                                    {phone.carrier !== 'Unknown' && (
                                      <span className="text-xs text-gray-600">{phone.carrier}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  {phone.tested && phone.reachable && (
                                    <span className="text-xs text-green-500">Reachable</span>
                                  )}
                                  {phone.tested && !phone.reachable && (
                                    <span className="text-xs text-red-400">Not Reachable</span>
                                  )}
                                  {phone.dnc && (
                                    <span className="text-xs text-yellow-400">DNC</span>
                                  )}
                                </div>
                                {/* Copy button */}
                                <button
                                  onClick={() => copyToClipboard(phone.rawNumber)}
                                  className="p-2 rounded-lg hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Copy number"
                                >
                                  {copiedText === phone.rawNumber ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <Copy className="w-4 h-4 text-gray-400" />
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
                        <Mail className="w-4 h-4 text-white/40" />
                        <h4 className="text-sm font-medium text-gray-300">
                          Email Addresses ({person.emails.length})
                        </h4>
                      </div>

                      {person.emails.length === 0 ? (
                        <p className="text-gray-500 text-sm bg-white/5 rounded-xl p-4">
                          No email addresses found for this person.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {person.emails.map((email, emailIndex) => (
                            <div
                              key={emailIndex}
                              className="flex items-center justify-between bg-white/5 rounded-xl p-3 group hover:bg-white/10 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                  <Mail className="w-4 h-4 text-white/40" />
                                </div>
                                <p className="text-white text-sm">{email.email}</p>
                              </div>
                              <button
                                onClick={() => copyToClipboard(email.email)}
                                className="p-2 rounded-lg hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                                title="Copy email"
                              >
                                {copiedText === email.email ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Warnings/Flags */}
                    {person.isLitigator && (
                      <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                        <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <p className="text-yellow-300 text-sm font-medium">
                          This person is flagged as a TCPA litigator. Exercise caution when making contact.
                        </p>
                      </div>
                    )}

                    {/* Active Listing Details */}
                    {person.activeListing && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Tag className="w-4 h-4 text-white/40" />
                          <h4 className="text-sm font-medium text-gray-300">Listing Details</h4>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {person.activeListing.price && (
                              <div>
                                <p className="text-xs text-gray-500">Asking Price</p>
                                <p className="text-white font-bold">${person.activeListing.price.toLocaleString()}</p>
                              </div>
                            )}
                            {person.activeListing.daysOnMarket !== null && (
                              <div>
                                <p className="text-xs text-gray-500">Days on Market</p>
                                <p className="text-white font-semibold">{person.activeListing.daysOnMarket} days</p>
                              </div>
                            )}
                            {person.activeListing.listedDate && (
                              <div>
                                <p className="text-xs text-gray-500">Listed Date</p>
                                <p className="text-white font-semibold">{person.activeListing.listedDate}</p>
                              </div>
                            )}
                            {person.activeListing.mlsNumber && (
                              <div>
                                <p className="text-xs text-gray-500">MLS #</p>
                                <p className="text-white font-semibold">{person.activeListing.mlsNumber}</p>
                              </div>
                            )}
                          </div>
                          {person.activeListing.listingAgent && (
                            <div className="pt-3 border-t border-white/10">
                              <p className="text-xs text-gray-500 mb-1">Listing Agent</p>
                              <p className="text-white text-sm font-medium">{person.activeListing.listingAgent.name}</p>
                              <div className="flex flex-wrap gap-3 mt-1">
                                {person.activeListing.listingAgent.phone && (
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {person.activeListing.listingAgent.phone}
                                  </span>
                                )}
                                {person.activeListing.listingAgent.email && (
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {person.activeListing.listingAgent.email}
                                  </span>
                                )}
                                {person.activeListing.listingAgent.website && (
                                  <a
                                    href={person.activeListing.listingAgent.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 hover:underline transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Website
                                  </a>
                                )}
                              </div>
                              {person.activeListing.listingOffice?.name && (
                                <p className="text-xs text-gray-500 mt-1">{person.activeListing.listingOffice.name}</p>
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
                          <TrendingUp className="w-4 h-4 text-white/40" />
                          <h4 className="text-sm font-medium text-gray-300">Recently Sold (MLS)</h4>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {person.recentlySold.price && (
                              <div>
                                <p className="text-xs text-gray-500">Listed Price</p>
                                <p className="text-white font-bold">${person.recentlySold.price.toLocaleString()}</p>
                              </div>
                            )}
                            {person.recentlySold.daysOnMarket !== null && (
                              <div>
                                <p className="text-xs text-gray-500">Days on Market</p>
                                <p className="text-white font-semibold">{person.recentlySold.daysOnMarket} days</p>
                              </div>
                            )}
                            {person.recentlySold.listedDate && (
                              <div>
                                <p className="text-xs text-gray-500">Listed Date</p>
                                <p className="text-white font-semibold">{person.recentlySold.listedDate}</p>
                              </div>
                            )}
                            {person.recentlySold.mlsNumber && (
                              <div>
                                <p className="text-xs text-gray-500">MLS #</p>
                                <p className="text-white font-semibold">{person.recentlySold.mlsNumber}</p>
                              </div>
                            )}
                          </div>
                          {person.recentlySold.listingAgent && (
                            <div className="pt-3 border-t border-white/10">
                              <p className="text-xs text-gray-500 mb-1">Listing Agent</p>
                              <p className="text-white text-sm font-medium">{person.recentlySold.listingAgent.name}</p>
                              <div className="flex flex-wrap gap-3 mt-1">
                                {person.recentlySold.listingAgent.phone && (
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {person.recentlySold.listingAgent.phone}
                                  </span>
                                )}
                                {person.recentlySold.listingAgent.email && (
                                  <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {person.recentlySold.listingAgent.email}
                                  </span>
                                )}
                                {person.recentlySold.listingAgent.website && (
                                  <a
                                    href={person.recentlySold.listingAgent.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 hover:underline transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Website
                                  </a>
                                )}
                              </div>
                              {person.recentlySold.listingOffice?.name && (
                                <p className="text-xs text-gray-500 mt-1">{person.recentlySold.listingOffice.name}</p>
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
                              <TrendingUp className="w-4 h-4 text-white/60" />
                              <h4 className="text-sm font-semibold text-white">Price History</h4>
                            </div>
                            <span className="text-xs text-gray-500">{history.length} recorded sale{history.length !== 1 ? 's' : ''}</span>
                          </div>

                          {/* Chart + timeline */}
                          <div className="rounded-xl border border-white/10 overflow-hidden">
                            {/* Mini bar chart */}
                            {prices.length > 1 && (
                              <div className="px-4 pt-4 pb-2 border-b border-white/10">
                                <p className="text-xs text-gray-500 mb-3">Sale price over time (oldest → newest)</p>
                                <div className="flex items-end gap-1.5 h-16">
                                  {[...history].reverse().map((sale, i) => {
                                    const pct = sale.price && maxPrice > 0 ? (sale.price / maxPrice) * 100 : 0;
                                    const isLatest = i === history.length - 1;
                                    return (
                                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                          <div className="bg-[#1a1a1a] border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white whitespace-nowrap shadow-xl">
                                            {sale.date && <p className="text-gray-400">{sale.date}</p>}
                                            <p className="font-semibold">{sale.price ? `$${sale.price.toLocaleString()}` : 'Unknown'}</p>
                                          </div>
                                        </div>
                                        <div
                                          className={`w-full rounded-t transition-all ${isLatest ? 'bg-white' : 'bg-white/30'}`}
                                          style={{ height: `${Math.max(pct, 8)}%` }}
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Timeline rows */}
                            <div className="divide-y divide-white/5">
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
                                  <div key={saleIndex} className={`flex items-center justify-between px-4 py-3 ${saleIndex === 0 ? 'bg-white/5' : 'hover:bg-white/3'} transition-colors`}>
                                    {/* Left: dot + date */}
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="flex flex-col items-center flex-shrink-0">
                                        <div className={`w-2.5 h-2.5 rounded-full ${saleIndex === 0 ? 'bg-white' : 'bg-white/30'}`} />
                                        {saleIndex < history.length - 1 && (
                                          <div className="w-px h-6 bg-white/10 mt-0.5" />
                                        )}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="text-sm text-white font-medium">
                                            {sale.date || 'Unknown date'}
                                          </span>
                                          {saleIndex === 0 && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/15">
                                              Most Recent
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-xs text-gray-500">Recorded sale</span>
                                      </div>
                                    </div>

                                    {/* Right: price + change */}
                                    <div className="text-right flex-shrink-0 ml-4">
                                      <p className="text-white font-bold text-sm">
                                        {sale.price ? `$${sale.price.toLocaleString()}` : '—'}
                                      </p>
                                      {changeStr && (
                                        <p className={`text-xs font-medium ${changePos ? 'text-green-400' : 'text-red-400'}`}>
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
                              <div className={`mt-3 flex items-center gap-3 p-3 rounded-xl border ${isUp ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                <TrendingUp className={`w-4 h-4 flex-shrink-0 ${isUp ? 'text-green-400' : 'text-red-400'}`} />
                                <p className="text-sm text-gray-300">
                                  Total appreciation:{' '}
                                  <span className={`font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
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


        {/* Search History */}
        {searchHistory.length > 0 && !results && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Recent Searches</h3>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // Parse the search string back into fields
                    const parts = search.split(',').map(p => p.trim());
                    if (parts.length >= 1) setStreet(parts[0]);
                    if (parts.length >= 2) setCity(parts[1]);
                    if (parts.length >= 3) {
                      const stateZip = parts[2].split(' ');
                      if (stateZip[0]) setState(stateZip[0]);
                      if (stateZip[1]) setZip(stateZip[1]);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-400 hover:text-white transition-all"
                >
                  <MapPin className="w-3 h-3" />
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

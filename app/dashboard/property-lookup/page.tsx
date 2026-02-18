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
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Search className="w-6 h-6 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Property Lookup</h1>
          </div>
          <p className="text-gray-400 ml-12">
            Search any address to find property owner information and contact details.
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 mb-8">
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
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
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
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
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
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="" className="bg-gray-800">Select State</option>
                  {US_STATES.map((s) => (
                    <option key={s.value} value={s.value} className="bg-gray-800">
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
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              <span className="text-red-400">*</span> Required: Street address and state. City and ZIP code are optional but help improve accuracy.
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
                  className="flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-all duration-200"
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
                className="bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden transition-all duration-200 hover:border-gray-700"
              >
                {/* Card Header - Always Visible */}
                <button
                  onClick={() => setExpandedPersonIndex(expandedPersonIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {person.owner.firstName?.[0]?.toUpperCase() || person.owner.lastName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-white font-semibold text-lg capitalize">
                          {person.owner.fullName.toLowerCase()}
                        </h3>
                        {person.dataSource === 'county_records_and_skip_trace' || person.dataSource === 'county_records_only' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/25">
                            <Shield className="w-3 h-3" />
                            County Verified
                          </span>
                        ) : null}
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
                  <div className="border-t border-gray-800 p-5 space-y-6">
                    {/* Addresses Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Property Address */}
                      <div className="bg-gray-800/40 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Home className="w-4 h-4 text-purple-400" />
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
                      <div className="bg-gray-800/40 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4 text-blue-400" />
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
                          <Home className="w-4 h-4 text-purple-400" />
                          <h4 className="text-sm font-medium text-gray-300">Property Details</h4>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {person.propertyDetails.yearBuilt && (
                            <div className="bg-gray-800/40 rounded-xl p-3 flex items-start gap-2">
                              <Calendar className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Year Built</p>
                                <p className="text-white text-sm font-medium">{person.propertyDetails.yearBuilt}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.squareFootage && (
                            <div className="bg-gray-800/40 rounded-xl p-3 flex items-start gap-2">
                              <Ruler className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Square Footage</p>
                                <p className="text-white text-sm font-medium">{Number(person.propertyDetails.squareFootage).toLocaleString()} sq ft</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.bedrooms && (
                            <div className="bg-gray-800/40 rounded-xl p-3 flex items-start gap-2">
                              <Bed className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Bedrooms</p>
                                <p className="text-white text-sm font-medium">{person.propertyDetails.bedrooms}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.bathrooms && (
                            <div className="bg-gray-800/40 rounded-xl p-3 flex items-start gap-2">
                              <Bath className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Bathrooms</p>
                                <p className="text-white text-sm font-medium">{person.propertyDetails.bathrooms}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.lotSize && (
                            <div className="bg-gray-800/40 rounded-xl p-3 flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Lot Size</p>
                                <p className="text-white text-sm font-medium">{person.propertyDetails.lotSize}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.assessedValue && (
                            <div className="bg-gray-800/40 rounded-xl p-3 flex items-start gap-2">
                              <DollarSign className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Assessed Value</p>
                                <p className="text-white text-sm font-medium">${Number(person.propertyDetails.assessedValue).toLocaleString()}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.lastSalePrice && (
                            <div className="bg-gray-800/40 rounded-xl p-3 flex items-start gap-2">
                              <DollarSign className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Last Sale Price</p>
                                <p className="text-white text-sm font-medium">${Number(person.propertyDetails.lastSalePrice).toLocaleString()}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.lastSaleDate && (
                            <div className="bg-gray-800/40 rounded-xl p-3 flex items-start gap-2">
                              <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Last Sale Date</p>
                                <p className="text-white text-sm font-medium">{person.propertyDetails.lastSaleDate}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.propertyType && (
                            <div className="bg-gray-800/40 rounded-xl p-3 flex items-start gap-2">
                              <Building className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Property Type</p>
                                <p className="text-white text-sm font-medium">{person.propertyDetails.propertyType}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.subdivision && (
                            <div className="bg-gray-800/40 rounded-xl p-3 flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-pink-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Subdivision</p>
                                <p className="text-white text-sm font-medium">{person.propertyDetails.subdivision}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.hoaFee && (
                            <div className="bg-gray-800/40 rounded-xl p-3 flex items-start gap-2">
                              <DollarSign className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">HOA Fee</p>
                                <p className="text-white text-sm font-medium">${person.propertyDetails.hoaFee}/mo</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.zoning && (
                            <div className="bg-gray-800/40 rounded-xl p-3 flex items-start gap-2">
                              <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-gray-500">Zoning</p>
                                <p className="text-white text-sm font-medium">{person.propertyDetails.zoning}</p>
                              </div>
                            </div>
                          )}
                          {person.propertyDetails.legalDescription && (
                            <div className="bg-gray-800/40 rounded-xl p-3 flex items-start gap-2 col-span-2 sm:col-span-3">
                              <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
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
                        <Phone className="w-4 h-4 text-green-400" />
                        <h4 className="text-sm font-medium text-gray-300">
                          Phone Numbers ({person.phoneNumbers.length})
                        </h4>
                      </div>

                      {person.phoneNumbers.length === 0 ? (
                        <p className="text-gray-500 text-sm bg-gray-800/40 rounded-xl p-4">
                          No phone numbers found for this person.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {person.phoneNumbers.map((phone, phoneIndex) => (
                            <div
                              key={phoneIndex}
                              className="flex items-center justify-between bg-gray-800/40 rounded-xl p-3 group hover:bg-gray-800/60 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                                  <Phone className="w-4 h-4 text-green-400" />
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
                        <Mail className="w-4 h-4 text-blue-400" />
                        <h4 className="text-sm font-medium text-gray-300">
                          Email Addresses ({person.emails.length})
                        </h4>
                      </div>

                      {person.emails.length === 0 ? (
                        <p className="text-gray-500 text-sm bg-gray-800/40 rounded-xl p-4">
                          No email addresses found for this person.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {person.emails.map((email, emailIndex) => (
                            <div
                              key={emailIndex}
                              className="flex items-center justify-between bg-gray-800/40 rounded-xl p-3 group hover:bg-gray-800/60 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                  <Mail className="w-4 h-4 text-blue-400" />
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
                    {(person.isLitigator || person.dnc) && (
                      <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                        <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          {person.isLitigator && (
                            <p className="text-yellow-300 text-sm font-medium">
                              This person is flagged as a TCPA litigator. Exercise caution when making contact.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Active Listing Details */}
                    {person.activeListing && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Tag className="w-4 h-4 text-green-400" />
                          <h4 className="text-sm font-medium text-gray-300">Listing Details</h4>
                        </div>
                        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 space-y-3">
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
                            <div className="pt-3 border-t border-green-500/10">
                              <p className="text-xs text-gray-500 mb-1">Listing Agent</p>
                              <p className="text-white text-sm font-medium">{person.activeListing.listingAgent.name}</p>
                              <div className="flex flex-wrap gap-3 mt-1">
                                {person.activeListing.listingAgent.phone && (
                                  <span className="text-xs text-green-400 flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {person.activeListing.listingAgent.phone}
                                  </span>
                                )}
                                {person.activeListing.listingAgent.email && (
                                  <span className="text-xs text-blue-400 flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {person.activeListing.listingAgent.email}
                                  </span>
                                )}
                                {person.activeListing.listingAgent.website && (
                                  <a
                                    href={person.activeListing.listingAgent.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-purple-400 flex items-center gap-1 hover:underline"
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

                    {/* Sale History */}
                    {person.propertyDetails?.saleHistory && person.propertyDetails.saleHistory.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-yellow-400" />
                          <h4 className="text-sm font-medium text-gray-300">Sale History</h4>
                        </div>
                        <div className="space-y-2">
                          {person.propertyDetails.saleHistory.map((sale, saleIndex) => (
                            <div key={saleIndex} className="flex items-center justify-between bg-gray-800/40 rounded-xl px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                                <span className="text-gray-300 text-sm">{sale.date || 'Unknown date'}</span>
                                {saleIndex === 0 && (
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">Most Recent</span>
                                )}
                              </div>
                              <span className="text-white font-semibold text-sm">
                                {sale.price ? `$${sale.price.toLocaleString()}` : 'Price unknown'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Disclaimer */}
                    <p className="text-xs text-gray-600 italic">
                      Owner information comes from county public records. Recently sold properties may show the previous owner. Contact information may not be current — verify before reaching out.
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
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg text-sm text-gray-400 hover:text-white transition-all"
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

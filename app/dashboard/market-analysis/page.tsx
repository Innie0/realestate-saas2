'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import {
  BarChart2, Search, Loader2, AlertCircle, Home, DollarSign,
  TrendingUp, BedDouble, Bath, Ruler, Clock, MapPin, Sparkles, ChevronDown, ChevronUp, X,
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

interface Comp {
  address: string;
  propertyType: string | null;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFootage: number | null;
  pricePerSqft: number | null;
  daysOnMarket: number | null;
  soldDate: string | null;
  distance: number | null;
}

interface AnalysisResult {
  address: string;
  propertyType: string | null;
  radius: number;
  yearsBack: number;
  avm: AVMResult | null;
  rentEstimate: RentEstimate | null;
  comps: Comp[];
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

function fmt(n: number | null, prefix = '', suffix = '') {
  if (n === null || n === undefined) return '—';
  return `${prefix}${n.toLocaleString()}${suffix}`;
}

function fmtDate(s: string | null) {
  if (!s) return '—';
  try { return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return s; }
}

export default function MarketAnalysisPage() {
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [radius, setRadius] = useState(0.5);
  const [yearsBack, setYearsBack] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [excludedIds, setExcludedIds] = useState<Set<number>>(new Set());
  const [showAllComps, setShowAllComps] = useState(false);

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
        body: JSON.stringify({ street: street.trim(), city: city.trim(), state, zip: zip.trim(), propertyType: propertyType || undefined, radius, yearsBack }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Analysis failed. Please try again.');
      } else {
        setResult(data.data);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const activeComps = result?.comps.filter((_, i) => !excludedIds.has(i)) ?? [];
  const visibleComps = showAllComps ? activeComps : activeComps.slice(0, 5);

  return (
    <div className="min-h-screen">
      <Header
        title="Market Analysis"
        subtitle="Get an instant value estimate, rent range, and comparable sales for any address"
      />

      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">

        {/* Search form */}
        <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Street Address *</label>
                <input
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  placeholder="123 Main St"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/30"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">City</label>
                <input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Los Angeles"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">State *</label>
                  <select
                    value={state}
                    onChange={e => setState(e.target.value)}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/30"
                  >
                    <option value="">State</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">ZIP</label>
                  <input
                    value={zip}
                    onChange={e => setZip(e.target.value)}
                    placeholder="90210"
                    maxLength={10}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Property Type</label>
                <select
                  value={propertyType}
                  onChange={e => setPropertyType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-white/30"
                >
                  {PROPERTY_TYPES.map(pt => (
                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">Comps will match this type. Auto-detect uses the subject property's type from Rentcast.</p>
              </div>
              <div className="sm:col-span-2 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-2">
                    Search Radius — <span className="text-white font-medium">{radius} mi</span>
                  </label>
                  <input
                    type="range"
                    min={0.25}
                    max={2}
                    step={0.25}
                    value={radius}
                    onChange={e => setRadius(Number(e.target.value))}
                    className="w-full accent-white"
                  />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                    <span>0.25 mi</span><span>1 mi</span><span>2 mi</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2">
                    Sales History — <span className="text-white font-medium">Past {yearsBack} {yearsBack === 1 ? 'year' : 'years'}</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={yearsBack}
                    onChange={e => setYearsBack(Number(e.target.value))}
                    className="w-full accent-white"
                  />
                  <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                    <span>1 yr</span><span>3 yr</span><span>5 yr</span>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !street.trim() || !state}
              className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 font-semibold py-2.5 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
              ) : (
                <><Search className="w-4 h-4" /> Run Market Analysis</>
              )}
            </button>
          </form>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map(i => (
              <div key={i} className="bg-[#111111] border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="h-4 bg-white/5 rounded w-1/3" />
                <div className="h-8 bg-white/5 rounded w-1/2" />
                <div className="h-3 bg-white/5 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-4">

            {/* Address banner */}
            <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium text-white">{result.address}</span>
              {result.propertyType && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/15">
                  {result.propertyType}
                </span>
              )}
              <span className="ml-auto text-xs text-gray-600">
                {new Date(result.queriedAt).toLocaleTimeString()}
              </span>
            </div>

            {/* Value + Rent row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Estimated Value */}
              <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <Home className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">Estimated Value</p>
                </div>
                {result.avm ? (
                  <>
                    <p className="text-3xl font-bold text-white mb-1">
                      {fmt(result.avm.estimatedValue, '$')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Range: {fmt(result.avm.valueLow, '$')} – {fmt(result.avm.valueHigh, '$')}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">Not available for this address</p>
                )}
              </div>

              {/* Rent Estimate */}
              <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">Monthly Rent Estimate</p>
                </div>
                {result.rentEstimate ? (
                  <>
                    <p className="text-3xl font-bold text-white mb-1">
                      {fmt(result.rentEstimate.monthlyRent, '$')}<span className="text-base text-gray-500 font-normal">/mo</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Range: {fmt(result.rentEstimate.rentLow, '$')} – {fmt(result.rentEstimate.rentHigh, '$')}/mo
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">Not available for this address</p>
                )}
              </div>
            </div>

            {/* AI Summary */}
            {result.summary && (
              <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">Market Summary</p>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">{result.summary}</p>
              </div>
            )}

            {/* Comps */}
            <div className="bg-[#111111] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-sm text-gray-400 font-medium">
                  Recent Comparable Sales
                  {result.propertyType ? ` · ${result.propertyType}` : ''}
                </p>
                <span className="ml-auto text-xs text-gray-600">
                  {result.radius} mi · past {result.yearsBack % 1 === 0 ? result.yearsBack : result.yearsBack.toFixed(1)} yr{result.yearsBack !== 1 ? 's' : ''}
                </span>
              </div>

              {activeComps.length === 0 ? (
                <p className="text-gray-500 text-sm">{result.comps.length === 0 ? 'No comparable sales found for these filters.' : 'All comps excluded — run a new search to reset.'}</p>
              ) : (
                <div className="space-y-3">
                  {visibleComps?.map((comp, i) => {
                    const globalIdx = result!.comps.findIndex((c, ci) => !excludedIds.has(ci) && c === comp);
                    const realIdx = result!.comps.indexOf(comp);
                    return (
                    <div key={realIdx} className="border border-white/8 rounded-xl p-3.5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                          <p className="text-sm font-medium text-white leading-tight">{comp.address}</p>
                          {comp.propertyType && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/10 whitespace-nowrap">
                              {comp.propertyType}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <p className="text-sm font-bold text-emerald-400 whitespace-nowrap">{fmt(comp.price, '$')}</p>
                          <button
                            type="button"
                            onClick={() => setExcludedIds(prev => new Set([...prev, realIdx]))}
                            className="p-1 rounded hover:bg-white/10 text-gray-600 hover:text-red-400 transition-colors"
                            title="Exclude this comp"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        {comp.bedrooms !== null && (
                          <span className="flex items-center gap-1">
                            <BedDouble className="w-3 h-3" /> {comp.bedrooms} bd
                          </span>
                        )}
                        {comp.bathrooms !== null && (
                          <span className="flex items-center gap-1">
                            <Bath className="w-3 h-3" /> {comp.bathrooms} ba
                          </span>
                        )}
                        {comp.squareFootage !== null && (
                          <span className="flex items-center gap-1">
                            <Ruler className="w-3 h-3" /> {comp.squareFootage.toLocaleString()} sqft
                          </span>
                        )}
                        {comp.pricePerSqft !== null && (
                          <span className="flex items-center gap-1">
                            <BarChart2 className="w-3 h-3" /> ${comp.pricePerSqft}/sqft
                          </span>
                        )}
                        {comp.daysOnMarket !== null && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {comp.daysOnMarket}d on market
                          </span>
                        )}
                        {comp.soldDate && (
                          <span className="text-gray-600">Sold {fmtDate(comp.soldDate)}</span>
                        )}
                        {comp.distance !== null && (
                          <span className="text-gray-600">{comp.distance.toFixed(2)} mi away</span>
                        )}
                      </div>
                    </div>
                    );
                  })}

                  {activeComps.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setShowAllComps(v => !v)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-white py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      {showAllComps ? (
                        <><ChevronUp className="w-3.5 h-3.5" /> Show fewer</>
                      ) : (
                        <><ChevronDown className="w-3.5 h-3.5" /> Show all {activeComps.length} comps</>
                      )}
                    </button>
                  )}
                  {excludedIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setExcludedIds(new Set())}
                      className="w-full text-xs text-gray-600 hover:text-gray-400 py-1.5 transition-colors"
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

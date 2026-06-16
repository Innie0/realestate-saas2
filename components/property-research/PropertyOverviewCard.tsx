'use client';

import { useState } from 'react';
import { Bed, Bath, Ruler, Home, Tag, DollarSign, TrendingUp, User, BarChart2, Download, Loader2 } from 'lucide-react';
import type { CmaAnalysisResult } from './CmaPanel';
import { buildCmaPdfPayload, downloadCmaPdf } from '@/lib/export-cma-pdf';

interface PropertyDetails {
  bedrooms?: string | number | null;
  bathrooms?: string | number | null;
  squareFootage?: string | number | null;
  yearBuilt?: string | number | null;
  propertyType?: string | null;
  assessedValue?: string | number | null;
  lastSalePrice?: string | number | null;
  lastSaleDate?: string | null;
  ownerName?: string | null;
}

interface ListingInfo {
  status?: string;
  price?: number | null;
  listedDate?: string | null;
  mlsNumber?: string | null;
}

interface OverviewPerson {
  propertyDetails?: PropertyDetails | null;
  activeListing?: ListingInfo | null;
  recentlySold?: ListingInfo | null;
  owner?: { fullName?: string };
  propertyAddress?: { formatted?: string };
}

function fmt(n: number | string | null | undefined, prefix = '') {
  if (n === null || n === undefined || n === '') return '—';
  const num = typeof n === 'string' ? parseFloat(n.replace(/[^0-9.-]/g, '')) : n;
  if (Number.isNaN(num)) return '—';
  return `${prefix}${num.toLocaleString()}`;
}

export interface PropertyOverviewCardProps {
  addressLabel: string;
  person?: OverviewPerson | null;
  cmaResult?: CmaAnalysisResult | null;
  hasLookup: boolean;
  onLookUpOwner: () => void;
  onRunCma: () => void;
}

export function PropertyOverviewCard({
  addressLabel,
  person,
  cmaResult,
  hasLookup,
  onLookUpOwner,
  onRunCma,
}: PropertyOverviewCardProps) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportError, setExportError] = useState('');

  const handleExportPdf = async () => {
    if (!cmaResult) return;
    setExportingPdf(true);
    setExportError('');
    try {
      await downloadCmaPdf(buildCmaPdfPayload(cmaResult));
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Could not export PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  const details = person?.propertyDetails;
  const active = person?.activeListing;
  const ownerName = person?.owner?.fullName;
  const displayOwner =
    ownerName && !ownerName.toLowerCase().includes('not found') ? ownerName : details?.ownerName;

  if (!hasLookup && !cmaResult) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
        <Home className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-900 font-medium mb-1">Enter an address above</p>
        <p className="text-sm text-gray-500 mb-6">
          Look up the owner for prospecting, or run a comp-based CMA for pricing.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onLookUpOwner} className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
            Look Up Owner
          </button>
          <button type="button" onClick={onRunCma} className="px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-xl hover:bg-brand-600">
            Run CMA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="p-5 border-b border-gray-200 bg-gray-50/50">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Subject Property</p>
        <h2 className="text-lg font-semibold text-gray-900">{addressLabel}</h2>
        {displayOwner && (
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            {displayOwner}
          </p>
        )}
      </div>

      <div className="p-5 space-y-4">
        {active?.price && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <Tag className="w-4 h-4 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Currently listed</p>
              <p className="text-sm text-amber-800">
                {fmt(active.price, '$')}
                {active.mlsNumber && ` · MLS #${active.mlsNumber}`}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {details?.bedrooms != null && (
            <div className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
              <Bed className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-sm font-semibold text-gray-900">{details.bedrooms}</p>
              <p className="text-[10px] text-gray-500">Beds</p>
            </div>
          )}
          {details?.bathrooms != null && (
            <div className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
              <Bath className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-sm font-semibold text-gray-900">{details.bathrooms}</p>
              <p className="text-[10px] text-gray-500">Baths</p>
            </div>
          )}
          {details?.squareFootage != null && (
            <div className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
              <Ruler className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-sm font-semibold text-gray-900">{Number(details.squareFootage).toLocaleString()}</p>
              <p className="text-[10px] text-gray-500">Sq Ft</p>
            </div>
          )}
          {details?.assessedValue != null && (
            <div className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
              <DollarSign className="w-4 h-4 text-gray-400 mx-auto mb-1" />
              <p className="text-sm font-semibold text-gray-900">{fmt(details.assessedValue, '$')}</p>
              <p className="text-[10px] text-gray-500">Assessed</p>
            </div>
          )}
        </div>

        {cmaResult && (
          <div className="p-4 rounded-xl border-2 border-brand-500/20 bg-brand-50/30">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-brand-500" />
              <p className="text-xs font-medium text-gray-600">CMA Results</p>
            </div>
            {cmaResult.valuation?.suggestedPrice ? (
              <>
                <p className="text-2xl font-bold text-gray-900">{fmt(cmaResult.valuation.suggestedPrice, '$')}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Range {fmt(cmaResult.valuation.priceLow, '$')} – {fmt(cmaResult.valuation.priceHigh, '$')}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-600">Analysis complete — open Market / CMA for full details.</p>
            )}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="mt-3 w-full flex items-center justify-center gap-2 text-sm font-medium text-brand-600 border border-brand-300 bg-white rounded-lg py-2 hover:bg-brand-50 disabled:opacity-50"
            >
              {exportingPdf ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF…</>
              ) : (
                <><Download className="w-4 h-4" /> Export Seller PDF</>
              )}
            </button>
            {exportError && (
              <p className="text-xs text-red-600 mt-2">{exportError}</p>
            )}
          </div>
        )}

        {details?.lastSalePrice != null && (
          <p className="text-xs text-gray-500">
            Last sale: {fmt(details.lastSalePrice, '$')}
            {details.lastSaleDate && ` · ${details.lastSaleDate}`}
          </p>
        )}

        <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={onLookUpOwner} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
            <User className="w-4 h-4" />
            {hasLookup ? 'View owner details' : 'Look up owner'}
          </button>
          <button type="button" onClick={onRunCma} className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand-500 text-white rounded-xl hover:bg-brand-600">
            <BarChart2 className="w-4 h-4" />
            {cmaResult ? 'View full CMA' : 'Run CMA'}
          </button>
        </div>
      </div>
    </div>
  );
}

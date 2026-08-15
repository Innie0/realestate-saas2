'use client';

import { useState } from 'react';
import { Bed, Bath, Ruler, Home, Tag, DollarSign, TrendingUp, User, Download, Loader2 } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import DataLoadingState from '@/components/dashboard/DataLoadingState';
import type { CmaAnalysisResult } from './CmaPanel';
import { buildCmaPdfPayload, downloadCmaPdf } from '@/lib/export-cma-pdf';
import { useToast } from '@/components/providers/ToastProvider';

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
  loading?: boolean;
  notFoundMessage?: string | null;
}

export function PropertyOverviewCard({
  addressLabel,
  person,
  cmaResult,
  loading = false,
  notFoundMessage,
}: PropertyOverviewCardProps) {
  const toast = useToast();
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportError, setExportError] = useState('');

  const handleExportPdf = async () => {
    if (!cmaResult) return;
    setExportingPdf(true);
    setExportError('');
    try {
      await downloadCmaPdf(buildCmaPdfPayload(cmaResult));
      toast.success('CMA PDF downloaded');
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

  const hasDetails =
    !!displayOwner ||
    !!active?.price ||
    details?.bedrooms != null ||
    details?.bathrooms != null ||
    details?.squareFootage != null ||
    details?.assessedValue != null ||
    details?.lastSalePrice != null ||
    !!cmaResult;

  if (loading) {
    return (
      <DataLoadingState
        title="Researching this address"
        description="Fetching county records and property details. First lookup usually takes 5–10 seconds."
        className="py-12"
      />
    );
  }

  if (!hasDetails) {
    return (
      <EmptyState
        icon={Home}
        title="No property details yet"
        description={
          notFoundMessage ||
          'We could not load property records for this address. Try the Owner & Contact tab or search again with a full street address.'
        }
        className="py-12"
      />
    );
  }

  return (
    <div className="overflow-hidden">
      <div className="border-b border-border bg-muted/30 p-5">
        <p className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
          Subject Property
        </p>
        <h2 className="text-[16px] font-semibold text-foreground">{addressLabel}</h2>
        {displayOwner && (
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <User className="size-3.5" />
            {displayOwner}
          </p>
        )}
      </div>

      <div className="space-y-4 p-5">
        {active?.price && (
          <div className="flex items-start gap-3 rounded-[10px] border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
            <Tag className="mt-0.5 size-4 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-[13px] font-medium text-amber-900 dark:text-amber-200">Currently listed</p>
              <p className="text-[13px] text-amber-800 dark:text-amber-300/90">
                {fmt(active.price, '$')}
                {active.mlsNumber && ` · MLS #${active.mlsNumber}`}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(4,minmax(0,1fr))]">
          {details?.bedrooms != null && (
            <div className="min-w-0 rounded-[10px] border border-border bg-muted/30 p-3 text-center">
              <Bed className="mx-auto mb-1 size-4 text-muted-foreground" />
              <p className="text-[15px] font-semibold text-foreground">{details.bedrooms}</p>
              <p className="text-[10.5px] text-muted-foreground">Beds</p>
            </div>
          )}
          {details?.bathrooms != null && (
            <div className="min-w-0 rounded-[10px] border border-border bg-muted/30 p-3 text-center">
              <Bath className="mx-auto mb-1 size-4 text-muted-foreground" />
              <p className="text-[15px] font-semibold text-foreground">{details.bathrooms}</p>
              <p className="text-[10.5px] text-muted-foreground">Baths</p>
            </div>
          )}
          {details?.squareFootage != null && (
            <div className="min-w-0 rounded-[10px] border border-border bg-muted/30 p-3 text-center">
              <Ruler className="mx-auto mb-1 size-4 text-muted-foreground" />
              <p className="text-[15px] font-semibold text-foreground">
                {Number(details.squareFootage).toLocaleString()}
              </p>
              <p className="text-[10.5px] text-muted-foreground">Sq Ft</p>
            </div>
          )}
          {details?.assessedValue != null && (
            <div className="min-w-0 rounded-[10px] border border-border bg-muted/30 p-3 text-center">
              <DollarSign className="mx-auto mb-1 size-4 text-muted-foreground" />
              <p className="text-[15px] font-semibold text-foreground">{fmt(details.assessedValue, '$')}</p>
              <p className="text-[10.5px] text-muted-foreground">Assessed</p>
            </div>
          )}
        </div>

        {cmaResult && (
          <div className="rounded-[10px] border border-border bg-muted/30 p-4">
            <div className="mb-1 flex items-center gap-2">
              <TrendingUp className="size-4 text-muted-foreground" />
              <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                CMA Results
              </p>
            </div>
            {cmaResult.valuation?.suggestedPrice ? (
              <>
                <p className="text-[22px] font-bold text-foreground">
                  {fmt(cmaResult.valuation.suggestedPrice, '$')}
                </p>
                <p className="mt-1 text-[12.5px] text-muted-foreground">
                  Range {fmt(cmaResult.valuation.priceLow, '$')} – {fmt(cmaResult.valuation.priceHigh, '$')}
                </p>
              </>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                Analysis complete — open Market analysis for full details.
              </p>
            )}
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] border border-border bg-card py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {exportingPdf ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Generating PDF…
                </>
              ) : (
                <>
                  <Download className="size-4" /> Export Seller PDF
                </>
              )}
            </button>
            {exportError && <p className="mt-2 text-[12px] text-rose-600">{exportError}</p>}
          </div>
        )}

        {details?.lastSalePrice != null && (
          <p className="text-[12.5px] text-muted-foreground">
            Last sale: {fmt(details.lastSalePrice, '$')}
            {details.lastSaleDate && ` · ${details.lastSaleDate}`}
          </p>
        )}
      </div>
    </div>
  );
}

'use client';

import {
  Bed,
  Bath,
  Ruler,
  Home,
  MapPin,
  DollarSign,
  TrendingUp,
  Calendar,
  User,
} from 'lucide-react';
import CmaListingImage from '@/components/property-research/CmaListingImage';
import type { CmaSubjectProfile } from '@/lib/subject-profile';
import type { SubjectProperty } from '@/lib/cma';

function fmt(n: number | null | undefined, prefix = '') {
  if (n === null || n === undefined) return '—';
  return `${prefix}${n.toLocaleString()}`;
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export interface CmaPropertyDashboardProps {
  address: string;
  subject: SubjectProperty;
  subjectProfile: CmaSubjectProfile | null | undefined;
  suggestedPrice: number | null;
  priceLow: number | null;
  priceHigh: number | null;
  avmValue: number | null;
  rentMonthly: number | null;
  activeListPrice: number | null;
  compCount: number;
}

export default function CmaPropertyDashboard({
  address,
  subject,
  subjectProfile,
  suggestedPrice,
  priceLow,
  priceHigh,
  avmValue,
  rentMonthly,
  activeListPrice,
  compCount,
}: CmaPropertyDashboardProps) {
  const imageUrl = subjectProfile?.imageUrl ?? null;

  return (
    <div className="overflow-hidden rounded-[12px] border border-gray-200 bg-[var(--surface)]">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="relative min-h-[180px] bg-gray-100 md:min-h-[220px]">
          {imageUrl ? (
            <CmaListingImage
              src={imageUrl}
              alt={`${subjectProfile?.imageSource === 'listing' ? 'Listing photo' : 'Map preview'} of ${address}`}
              imageSource={subjectProfile?.imageSource}
              sizes="(max-width: 768px) 100vw, 45vw"
            />
          ) : (
            <div className="flex h-full min-h-[180px] items-center justify-center text-gray-400 md:min-h-[220px]">
              <Home className="h-10 w-10" />
            </div>
          )}
          {suggestedPrice ? (
            <div className="absolute bottom-3 left-3 rounded-[10px] border border-white/80 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm">
              <p className="text-[10px] font-mono uppercase tracking-[0.06em] text-gray-500">
                Suggested list
              </p>
              <p className="text-[20px] font-bold text-gray-900">{fmt(suggestedPrice, '$')}</p>
              {priceLow && priceHigh && (
                <p className="text-[11px] text-gray-600">
                  {fmt(priceLow, '$')} – {fmt(priceHigh, '$')} · {compCount} comp
                  {compCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col justify-between gap-4 p-4 md:p-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-gray-500">
              Property dashboard
            </p>
            <h3 className="mt-1 text-[15px] font-semibold leading-snug text-gray-900">{address}</h3>
            {subjectProfile?.ownerName && (
              <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-gray-600">
                <User className="h-3.5 w-3.5" />
                {subjectProfile.ownerName}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-gray-700">
              <span className="inline-flex items-center gap-1">
                <Bed className="h-3.5 w-3.5 text-gray-500" />
                {subject.bedrooms ?? '—'} bd
              </span>
              <span className="inline-flex items-center gap-1">
                <Bath className="h-3.5 w-3.5 text-gray-500" />
                {subject.bathrooms ?? '—'} ba
              </span>
              <span className="inline-flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5 text-gray-500" />
                {subject.squareFootage
                  ? `${subject.squareFootage.toLocaleString()} sqft`
                  : '— sqft'}
              </span>
              {(subject.yearBuilt ?? subjectProfile?.yearBuilt) && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                  Built {subject.yearBuilt ?? subjectProfile?.yearBuilt}
                </span>
              )}
            </div>
            {(subjectProfile?.county || subjectProfile?.zoning) && (
              <p className="mt-2 flex items-start gap-1.5 text-[11.5px] text-gray-600">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {[subjectProfile.county, subjectProfile.zoning && `Zoning ${subjectProfile.zoning}`]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {activeListPrice ? (
              <StatPill icon={TrendingUp} label="Listed" value={fmt(activeListPrice, '$')} />
            ) : null}
            {avmValue ? (
              <StatPill icon={DollarSign} label="AVM" value={fmt(avmValue, '$')} />
            ) : null}
            {rentMonthly ? (
              <StatPill icon={Home} label="Rent est." value={`${fmt(rentMonthly, '$')}/mo`} />
            ) : null}
            {subjectProfile?.assessedValue ? (
              <StatPill
                icon={DollarSign}
                label="Assessed"
                value={fmt(subjectProfile.assessedValue, '$')}
              />
            ) : null}
            {subjectProfile?.lastSalePrice ? (
              <StatPill
                icon={TrendingUp}
                label={`Sold ${fmtDate(subjectProfile.lastSaleDate)}`}
                value={fmt(subjectProfile.lastSalePrice, '$')}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Home;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[10px] border border-gray-150 bg-gray-50/80 px-2.5 py-2">
      <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="mt-0.5 text-[13px] font-semibold text-gray-900">{value}</p>
    </div>
  );
}

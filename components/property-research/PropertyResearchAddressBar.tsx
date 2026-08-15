'use client';

import Link from 'next/link';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import { propertyResearchLandingHref, cmaPropertyHref, type PropertyAddressFields } from '@/lib/property-research-routes';

interface PropertyResearchAddressBarProps {
  fields: PropertyAddressFields;
  label: string;
  contextLabel?: string;
  showRunCma?: boolean;
}

export default function PropertyResearchAddressBar({
  fields,
  label,
  contextLabel = 'Owner & details',
  showRunCma = false,
}: PropertyResearchAddressBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link
          href={propertyResearchLandingHref()}
          className="mb-2 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          New search
        </Link>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
          {contextLabel}
        </p>
        <p className="break-words text-[15px] font-semibold text-foreground">{label}</p>
      </div>

      {showRunCma ? (
        <Link
          href={cmaPropertyHref(fields)}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-border bg-muted/40 px-3 py-2 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted sm:self-auto"
        >
          <BarChart2 className="size-4" strokeWidth={1.75} />
          Run CMA
        </Link>
      ) : null}
    </div>
  );
}

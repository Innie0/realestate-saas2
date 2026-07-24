'use client';

import Link from 'next/link';
import { ArrowUpRight, DoorOpen, Inbox, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import {
  ClientLeadOrigin,
  formatLeadCaptureDate,
  truncateLeadMessage,
} from '@/lib/client-lead-origin';

interface ClientLeadOriginCardProps {
  leadOrigin: ClientLeadOrigin;
  clientId: string;
  inCrm: boolean;
}

const SOURCE_ICONS = {
  lead_form: Sparkles,
  open_house: DoorOpen,
  listing_page: Inbox,
} as const;

export default function ClientLeadOriginCard({
  leadOrigin,
  clientId,
  inCrm,
}: ClientLeadOriginCardProps) {
  const Icon = SOURCE_ICONS[leadOrigin.source] ?? Sparkles;
  const capturedLabel = formatLeadCaptureDate(leadOrigin.captured_at);
  const promotedLabel = leadOrigin.promoted_at
    ? formatLeadCaptureDate(leadOrigin.promoted_at)
    : null;

  return (
    <Card className="p-5 sm:p-[22px] border-teal-100 bg-teal-50/40">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-800">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-teal-800">
            Lead source
          </p>
          <h2 className="mt-1 text-[15px] font-semibold text-gray-900">
            Captured via {leadOrigin.source_label}
          </h2>
          <p className="mt-1 text-[13px] text-gray-600">
            {capturedLabel}
            {leadOrigin.lead_type_label ? ` · ${leadOrigin.lead_type_label}` : ''}
            {promotedLabel && inCrm ? ` · Added to CRM ${promotedLabel}` : ''}
          </p>

          {leadOrigin.message && (
            <p className="mt-3 text-[13px] text-gray-700 whitespace-pre-wrap rounded-lg bg-white/70 border border-teal-100 px-3 py-2.5">
              {truncateLeadMessage(leadOrigin.message)}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px]">
            {leadOrigin.project && (
              <Link
                href={`/dashboard/projects/${leadOrigin.project.id}`}
                className="inline-flex items-center gap-1 font-medium text-teal-800 hover:text-teal-950"
              >
                Inquired about {leadOrigin.project.title}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}

            {!inCrm && (
              <Link
                href={`/dashboard/leads?tab=inbox&highlight=${clientId}`}
                className="inline-flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
              >
                View in leads inbox
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}

            {leadOrigin.ad_source && (
              <span className="text-[12px] text-gray-600">
                Ad attribution: {leadOrigin.ad_source.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

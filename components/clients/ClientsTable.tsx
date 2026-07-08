'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import type { ClientListRow } from '@/lib/client-crm-display';
import {
  STAGE_BADGE,
  formatFollowUpLabel,
  formatLastContact,
  getClientAvatarClass,
  getClientInitials,
  getClientInterest,
  getClientStage,
} from '@/lib/client-crm-display';
import StaggerList, { StaggerItem } from '@/components/motion/StaggerList';

interface ClientsTableProps {
  clients: ClientListRow[];
}

export default function ClientsTable({ clients }: ClientsTableProps) {
  return (
    <div className="rounded-2xl bg-white ring-1 ring-gray-900/[0.04] shadow-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-[#FAFAF8]">
              {['Client', 'Interest', 'Stage', 'Last contact', 'Next follow-up'].map((heading) => (
                <th
                  key={heading}
                  className="px-4 sm:px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <StaggerList as="tbody" className="divide-y divide-gray-100">
            {clients.map((client) => {
              const interest = getClientInterest(client);
              const stage = getClientStage(client);
              const stageStyle = STAGE_BADGE[stage];
              const followUp = formatFollowUpLabel(client.next_reminder);
              const isOverdue = client.next_reminder?.is_overdue;

              return (
                <StaggerItem
                  key={client.id}
                  as="tr"
                  className="group hover:bg-gray-50/80 transition-colors hover:shadow-[inset_3px_0_0_0_#fc5c03]"
                >
                  <td className="px-4 sm:px-5 py-4">
                    <Link href={`/dashboard/clients/${client.id}`} className="flex items-center gap-3 min-w-0 group/link">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ring-1 ring-black/5 ${getClientAvatarClass(client.name)}`}
                        aria-hidden
                      >
                        {getClientInitials(client.name) || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover/link:text-brand-700 transition-colors">
                          {client.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{client.email || client.phone || '—'}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 sm:px-5 py-4">
                    <p className="text-sm text-gray-900 truncate">{interest.headline}</p>
                    {interest.subline && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{interest.subline}</p>
                    )}
                  </td>
                  <td className="px-4 sm:px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${stageStyle.className}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${stageStyle.dotClassName}`} />
                      {stageStyle.label}
                    </span>
                  </td>
                  <td className="px-4 sm:px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {formatLastContact(client.last_contact_at)}
                    </span>
                  </td>
                  <td className="px-4 sm:px-5 py-4">
                    <span
                      className={`text-sm ${
                        followUp.tone === 'overdue'
                          ? 'text-amber-700 font-medium'
                          : followUp.tone === 'upcoming'
                            ? 'text-gray-700'
                            : 'text-gray-400'
                      } ${isOverdue ? 'animate-pulse' : ''}`}
                    >
                      {followUp.text}
                    </span>
                  </td>
                </StaggerItem>
              );
            })}
          </StaggerList>
        </table>
      </div>
    </div>
  );
}

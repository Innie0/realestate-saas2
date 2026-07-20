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
    <div className="rounded-[10px] bg-[var(--surface)] border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-gray-150 bg-gray-50">
              {['Client', 'Interest', 'Stage', 'Last contact', 'Next follow-up'].map((heading) => (
                <th
                  key={heading}
                  className="px-4 sm:px-5 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-600"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <StaggerList as="tbody" className="divide-y divide-gray-150">
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
                  className="group hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 sm:px-5 py-4">
                    <Link href={`/dashboard/clients/${client.id}`} className="flex items-center gap-3 min-w-0 group/link">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${getClientAvatarClass(client.name)}`}
                        aria-hidden
                      >
                        {getClientInitials(client.name) || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-gray-900 truncate group-hover/link:text-gray-950 transition-colors">
                          {client.name}
                        </p>
                        <p className="text-[12px] text-gray-600 truncate">{client.email || client.phone || '—'}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 sm:px-5 py-4">
                    <p className="text-[13px] text-gray-900 truncate">{interest.headline}</p>
                    {interest.subline && (
                      <p className="text-[12px] text-gray-600 truncate mt-0.5">{interest.subline}</p>
                    )}
                  </td>
                  <td className="px-4 sm:px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium border ${stageStyle.className}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${stageStyle.dotClassName}`} />
                      {stageStyle.label}
                    </span>
                  </td>
                  <td className="px-4 sm:px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-gray-700">
                      <Clock className="w-3.5 h-3.5 text-gray-600" />
                      {formatLastContact(client.last_contact_at)}
                    </span>
                  </td>
                  <td className="px-4 sm:px-5 py-4">
                    <span
                      className={`text-[13px] ${
                        followUp.tone === 'overdue'
                          ? 'text-amber-700 font-medium'
                          : followUp.tone === 'upcoming'
                            ? 'text-gray-700'
                            : 'text-gray-600'
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

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

interface ClientsTableProps {
  clients: ClientListRow[];
}

export default function ClientsTable({ clients }: ClientsTableProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
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
          <tbody className="divide-y divide-gray-100">
            {clients.map((client) => {
              const interest = getClientInterest(client);
              const stage = getClientStage(client);
              const stageStyle = STAGE_BADGE[stage];
              const followUp = formatFollowUpLabel(client.next_reminder);

              return (
                <tr key={client.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 sm:px-5 py-4">
                    <Link href={`/dashboard/clients/${client.id}`} className="flex items-center gap-3 min-w-0 group">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${getClientAvatarClass(client.name)}`}
                      >
                        {getClientInitials(client.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-brand-700 transition-colors">
                          {client.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{client.email || client.phone || '—'}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 sm:px-5 py-4">
                    <p className="text-sm text-gray-900">{interest.headline}</p>
                    {interest.subline && (
                      <p className="text-xs text-gray-500 mt-0.5">{interest.subline}</p>
                    )}
                  </td>
                  <td className="px-4 sm:px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${stageStyle.className}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${stageStyle.dotClassName}`} />
                      {stageStyle.label}
                    </span>
                  </td>
                  <td className="px-4 sm:px-5 py-4 text-sm text-gray-700 whitespace-nowrap">
                    {formatLastContact(client.last_contact_at)}
                  </td>
                  <td className="px-4 sm:px-5 py-4">
                    {followUp.tone === 'none' ? (
                      <span className="text-sm text-gray-400">—</span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 text-sm ${
                          followUp.tone === 'overdue' ? 'text-red-600 font-medium' : 'text-amber-800'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {followUp.text}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

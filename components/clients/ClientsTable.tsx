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
import { Card } from '@/components/ui/Card';
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ClientsTableProps {
  clients: ClientListRow[];
}

export default function ClientsTable({ clients }: ClientsTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow>
              {['Client', 'Interest', 'Stage', 'Last contact', 'Next follow-up'].map((heading) => (
                <TableHead key={heading}>{heading}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <StaggerList as="tbody">
            {clients.map((client) => {
              const interest = getClientInterest(client);
              const stage = getClientStage(client);
              const stageStyle = STAGE_BADGE[stage];
              const followUp = formatFollowUpLabel(client.next_reminder);
              const isOverdue = client.next_reminder?.is_overdue;

              return (
                <StaggerItem key={client.id} as="tr" className="group">
                  <TableCell>
                    <Link href={`/dashboard/clients/${client.id}`} className="flex items-center gap-3 min-w-0 group/link">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getClientAvatarClass(client.name)}`}
                        aria-hidden
                      >
                        {getClientInitials(client.name) || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover/link:text-foreground">
                          {client.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{client.email || client.phone || '—'}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="truncate text-sm text-foreground">{interest.headline}</p>
                    {interest.subline && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{interest.subline}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${stageStyle.className}`}
                    >
                      <span className={`size-1.5 rounded-full ${stageStyle.dotClassName}`} />
                      {stageStyle.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="size-3.5" />
                      {formatLastContact(client.last_contact_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-sm ${
                        followUp.tone === 'overdue'
                          ? 'font-medium text-amber-700'
                          : followUp.tone === 'upcoming'
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                      } ${isOverdue ? 'animate-pulse' : ''}`}
                    >
                      {followUp.text}
                    </span>
                  </TableCell>
                </StaggerItem>
              );
            })}
          </StaggerList>
        </Table>
      </div>
    </Card>
  );
}

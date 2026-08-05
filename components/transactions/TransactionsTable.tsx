'use client';

import Link from 'next/link';
import { Calendar, Home } from 'lucide-react';
import type { TransactionWithDetails } from '@/types';
import StaggerList, { StaggerItem } from '@/components/motion/StaggerList';
import TransactionStatusBadge from '@/components/transactions/TransactionStatusBadge';
import { Card } from '@/components/ui/Card';
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TransactionsTableProps {
  transactions: TransactionWithDetails[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function closingLabel(transaction: TransactionWithDetails): string | null {
  if (['closed', 'cancelled', 'expired'].includes(transaction.status)) return null;
  if (!transaction.closing_date || transaction.days_to_closing == null) return null;

  const days = transaction.days_to_closing;
  if (days < 0) return `${Math.abs(days)}d past`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days}d`;
}

export default function TransactionsTable({ transactions }: TransactionsTableProps) {
  return (
    <Card className="overflow-hidden border-border p-0 shadow-none">
      <div className="overflow-x-auto">
        <Table className="min-w-[880px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {['Property', 'Status', 'Price', 'Buyer', 'Seller', 'Closing', 'Tasks'].map((heading) => (
                <TableHead key={heading}>{heading}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <StaggerList as="tbody">
            {transactions.map((transaction) => {
              const closing = closingLabel(transaction);
              const location = [transaction.property_city, transaction.property_state, transaction.property_zip]
                .filter(Boolean)
                .join(', ');

              return (
                <StaggerItem key={transaction.id} as="tr" className="group">
                  <TableCell>
                    <Link
                      href={`/dashboard/transactions/${transaction.id}`}
                      className="flex min-w-0 items-center gap-3 group/link"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                        <Home className="size-[18px]" strokeWidth={1.75} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover/link:text-brand-600">
                          {transaction.property_address}
                        </p>
                        {location ? (
                          <p className="truncate text-xs text-muted-foreground">{location}</p>
                        ) : null}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <TransactionStatusBadge status={transaction.status} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatCurrency(transaction.offer_price)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block max-w-[140px] truncate text-sm text-foreground">
                      {transaction.buyer_name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="block max-w-[140px] truncate text-sm text-foreground">
                      {transaction.seller_name}
                    </span>
                  </TableCell>
                  <TableCell>
                    {closing ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="size-3.5" />
                        {closing}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm tabular-nums text-foreground">
                      {transaction.completed_items_count ?? 0}/{transaction.total_items_count ?? 0}
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

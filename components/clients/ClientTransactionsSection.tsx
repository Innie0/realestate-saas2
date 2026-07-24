'use client';

import Link from 'next/link';
import { ArrowUpRight, FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ClientLinkedTransaction } from '@/types';
import { getTransactionStatusBadgeVariant } from '@/lib/transaction-status';

interface ClientTransactionsSectionProps {
  transactions: ClientLinkedTransaction[];
}

function formatStatus(status: string): string {
  if (status === 'under_contract') return 'Under Contract';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ClientTransactionsSection({
  transactions,
}: ClientTransactionsSectionProps) {
  if (transactions.length === 0) {
    return null;
  }

  return (
    <Card className="p-5 sm:p-[22px]">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-gray-700" />
        <h2 className="text-[15px] font-semibold text-gray-900">Transactions</h2>
      </div>

      <div className="space-y-2.5">
        {transactions.map((transaction) => (
          <Link
            key={transaction.id}
            href={`/dashboard/transactions/${transaction.id}`}
            className="block p-3.5 rounded-lg border border-gray-150 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13.5px] font-medium text-gray-900 truncate">
                  {transaction.property_address}
                </p>
                <p className="text-[12.5px] text-gray-600 mt-1">
                  {formatCurrency(transaction.offer_price)}
                  {' · '}
                  {transaction.role === 'buyer' ? 'Buyer' : 'Seller'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={getTransactionStatusBadgeVariant(transaction.status)}>
                  {formatStatus(transaction.status)}
                </Badge>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-500" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

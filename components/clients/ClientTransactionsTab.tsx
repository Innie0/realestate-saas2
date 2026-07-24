'use client';

import Link from 'next/link';
import { FileText, FolderOpen } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ClientTransactionsSection from '@/components/clients/ClientTransactionsSection';
import { ClientLinkedTransaction } from '@/types';

interface ClientTransactionsTabProps {
  transactions: ClientLinkedTransaction[];
  clientId: string;
}

export default function ClientTransactionsTab({
  transactions,
  clientId,
}: ClientTransactionsTabProps) {
  if (transactions.length === 0) {
    return (
      <Card className="p-8 sm:p-12 text-center border-dashed">
        <FileText className="w-10 h-10 mx-auto text-gray-400 mb-3" />
        <h3 className="text-[15px] font-semibold text-gray-900 mb-1">No transactions yet</h3>
        <p className="text-[13px] text-gray-600 mb-4 max-w-sm mx-auto">
          Deals linked to this client as buyer or seller will show up here.
        </p>
        <Link href={`/dashboard/transactions/new?client_id=${clientId}`}>
          <Button variant="outline" size="sm">Create transaction</Button>
        </Link>
      </Card>
    );
  }

  return <ClientTransactionsSection transactions={transactions} />;
}

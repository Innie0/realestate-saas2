// Transactions List Page
// Displays all transactions with filtering and search

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Home, Filter } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import DashboardPage from '@/components/layout/DashboardPage';
import ListPageToolbar from '@/components/layout/ListPageToolbar';
import FilterSidebar from '@/components/layout/FilterSidebar';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import { TransactionsPageContentSkeleton } from '@/components/dashboard/page-loading';
import TransactionsTable from '@/components/transactions/TransactionsTable';
import { TransactionWithDetails } from '@/types';
import { useApi } from '@/lib/swr';
import { cn } from '@/lib/utils';

type SortKey = 'newest' | 'closing' | 'price_desc' | 'price_asc';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'open', label: 'In progress' },
  { value: 'all', label: 'All deals' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_contract', label: 'Under contract' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'expired', label: 'Expired' },
];

function sortTransactions(transactions: TransactionWithDetails[], sortKey: SortKey) {
  const list = [...transactions];
  switch (sortKey) {
    case 'closing':
      return list.sort((a, b) => {
        const aDays = a.days_to_closing ?? Number.MAX_SAFE_INTEGER;
        const bDays = b.days_to_closing ?? Number.MAX_SAFE_INTEGER;
        return aDays - bDays;
      });
    case 'price_desc':
      return list.sort((a, b) => b.offer_price - a.offer_price);
    case 'price_asc':
      return list.sort((a, b) => a.offer_price - b.offer_price);
    case 'newest':
    default:
      return list.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
  }
}

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [sortKey, setSortKey] = useState<SortKey>('newest');

  const transactionsUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    const qs = params.toString();
    return `/api/transactions${qs ? `?${qs}` : ''}`;
  }, [statusFilter]);

  const { data: transactions = [], isLoading, error: fetchError } = useApi<TransactionWithDetails[]>(transactionsUrl);
  const error = fetchError?.message ?? '';

  useEffect(() => {
    document.title = 'Transactions - Oikaro';
  }, []);

  const filteredTransactions = useMemo(() => {
    const searched = transactions.filter((transaction) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        transaction.property_address.toLowerCase().includes(search) ||
        transaction.buyer_name.toLowerCase().includes(search) ||
        transaction.seller_name.toLowerCase().includes(search) ||
        transaction.property_city?.toLowerCase().includes(search)
      );
    });
    return sortTransactions(searched, sortKey);
  }, [transactions, searchTerm, sortKey]);

  return (
    <DashboardPage title="Transactions" subtitle="Track deals, milestones, documents, and closing dates">
      {isLoading ? (
        <TransactionsPageContentSkeleton />
      ) : (
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <FilterSidebar
            title="Filters"
            className="lg:sticky lg:top-24"
            groups={[
              {
                id: 'status',
                label: 'Status',
                icon: Filter,
                defaultOpen: true,
                children: (
                  <div className="space-y-1">
                    {STATUS_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setStatusFilter(value)}
                        className={cn(
                          'flex w-full items-center rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
                          statusFilter === value
                            ? 'bg-foreground text-background'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ),
              },
            ]}
          />

          <div className="min-w-0 flex-1 space-y-5">
            <ListPageToolbar
              search={
                <SearchInput
                  placeholder="Search by address, buyer, or seller..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              }
              sort={
                <Select
                  value={sortKey}
                  onChange={(value) => setSortKey(value as SortKey)}
                  className="sm:min-w-[160px]"
                  triggerClassName="py-2 text-[13px]"
                  options={[
                    { value: 'newest', label: 'Newest first' },
                    { value: 'closing', label: 'Closing soon' },
                    { value: 'price_desc', label: 'Price: high to low' },
                    { value: 'price_asc', label: 'Price: low to high' },
                  ]}
                />
              }
              addHref="/dashboard/transactions/new"
              addLabel="New Transaction"
              meta={
                filteredTransactions.length > 0
                  ? `${filteredTransactions.length} deal${filteredTransactions.length === 1 ? '' : 's'}`
                  : undefined
              }
            />

            {error && (
              <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
            )}

            {filteredTransactions.length === 0 ? (
              <Card className="border-border p-0 shadow-none">
                <EmptyState
                  icon={Home}
                  title={
                    searchTerm || statusFilter !== 'open'
                      ? 'No matching transactions'
                      : 'No transactions yet'
                  }
                  description={
                    searchTerm || statusFilter !== 'open'
                      ? 'Try adjusting your search or filters to find a deal.'
                      : 'Create your first transaction to track milestones, documents, and closing dates.'
                  }
                  action={
                    !searchTerm && statusFilter === 'open' ? (
                      <Link href="/dashboard/transactions/new">
                        <Button>
                          <Plus className="mr-2 size-4" />
                          Create transaction
                        </Button>
                      </Link>
                    ) : undefined
                  }
                />
              </Card>
            ) : (
              <TransactionsTable transactions={filteredTransactions} />
            )}
          </div>
        </div>
      )}
    </DashboardPage>
  );
}

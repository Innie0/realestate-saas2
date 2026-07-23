// Transactions List Page
// Displays all transactions with filtering and search

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus, Home,
  Calendar, ArrowRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import DashboardPage from '@/components/layout/DashboardPage';
import PageToolbar from '@/components/layout/PageToolbar';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import { TransactionsPageContentSkeleton } from '@/components/dashboard/page-loading';
import TransactionStatusBadge from '@/components/transactions/TransactionStatusBadge';
import StaggerList, { StaggerItem } from '@/components/motion/StaggerList';
import { TransactionWithDetails } from '@/types';
import { useApi } from '@/lib/swr';

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');

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

  const filteredTransactions = transactions.filter((transaction) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      transaction.property_address.toLowerCase().includes(search) ||
      transaction.buyer_name.toLowerCase().includes(search) ||
      transaction.seller_name.toLowerCase().includes(search) ||
      transaction.property_city?.toLowerCase().includes(search)
    );
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const closingCopy = (transaction: TransactionWithDetails) => {
    if (['closed', 'cancelled', 'expired'].includes(transaction.status)) return null;
    if (!transaction.closing_date || transaction.days_to_closing == null) return null;

    const days = transaction.days_to_closing;
    if (days < 0) return `${Math.abs(days)}d past closing`;
    if (days === 0) return 'today';
    if (days === 1) return 'tomorrow';
    return `in ${days} days`;
  };

  return (
    <DashboardPage title="Transactions" subtitle="Track deals, milestones, documents, and closing dates">
      {isLoading ? (
        <TransactionsPageContentSkeleton />
      ) : (
        <>
      <PageToolbar
        meta={filteredTransactions.length > 0 ? `${filteredTransactions.length} deal${filteredTransactions.length === 1 ? '' : 's'}` : undefined}
      >
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          <SearchInput
            placeholder="Search by address, buyer, or seller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="sm:min-w-[180px]"
            options={[
              { value: 'open', label: 'In progress' },
              { value: 'all', label: 'All deals' },
              { value: 'active', label: 'Active' },
              { value: 'pending', label: 'Pending' },
              { value: 'under_contract', label: 'Under contract' },
              { value: 'closed', label: 'Closed' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'expired', label: 'Expired' },
            ]}
          />
        </div>
        <Link href="/dashboard/transactions/new" className="w-full sm:w-auto shrink-0">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            New Transaction
          </Button>
        </Link>
      </PageToolbar>

      {error && (
        <div className="p-4 bg-red-50 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {filteredTransactions.length === 0 ? (
        <Card className="p-0">
          <EmptyState
            icon={Home}
            title={searchTerm || statusFilter !== 'open' ? 'No matching transactions' : 'No transactions yet'}
            description={
              searchTerm || statusFilter !== 'open'
                ? 'Try adjusting your search or filters to find a deal.'
                : 'Create your first transaction to track milestones, documents, and closing dates.'
            }
            action={
              !searchTerm && statusFilter === 'open' ? (
                <Link href="/dashboard/transactions/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create transaction
                  </Button>
                </Link>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <StaggerList className="space-y-3">
          {filteredTransactions.map((transaction) => {
            const closing = closingCopy(transaction);
            return (
              <StaggerItem key={transaction.id}>
                <Link href={`/dashboard/transactions/${transaction.id}`} className="block">
                  <Card className="cursor-pointer p-5 transition-colors hover:bg-muted/40 sm:p-[22px]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-brand-50 text-brand-700">
                          <Home className="w-[18px] h-[18px]" strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate text-[17px] font-semibold text-foreground">
                            {transaction.property_address}
                          </h3>
                          {(transaction.property_city || transaction.property_state) && (
                            <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                              {[transaction.property_city, transaction.property_state, transaction.property_zip]
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-1.5">
                        <TransactionStatusBadge status={transaction.status} />
                        {closing && (
                          <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {transaction.days_to_closing} days to closing
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="mb-0.5 text-[11.5px] text-muted-foreground">Price</p>
                        <p className="text-[15px] font-semibold tabular-nums text-primary">{formatCurrency(transaction.offer_price)}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="mb-0.5 text-[11.5px] text-muted-foreground">Buyer</p>
                        <p className="truncate text-[14px] font-medium text-foreground">{transaction.buyer_name}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="mb-0.5 text-[11.5px] text-muted-foreground">Seller</p>
                        <p className="truncate text-[14px] font-medium text-foreground">{transaction.seller_name}</p>
                      </div>
                      <div>
                        <p className="mb-0.5 text-[11.5px] text-muted-foreground">Tasks</p>
                        <p className="text-[14px] font-medium text-foreground">
                          {transaction.completed_items_count}/{transaction.total_items_count}
                        </p>
                      </div>
                    </div>

                    {closing && (
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                        <p className="text-[13px] text-muted-foreground">
                          <span className="font-semibold text-foreground">Closing</span> {closing}
                        </p>
                        <ArrowRight className="size-4 text-muted-foreground" />
                      </div>
                    )}
                  </Card>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerList>
      )}
        </>
      )}
    </DashboardPage>
  );
}

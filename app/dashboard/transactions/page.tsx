// Transactions List Page
// Displays all transactions with filtering and search

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus, Building2,
  Calendar, ChevronRight, AlertCircle,
  Clock,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import DashboardPage from '@/components/layout/DashboardPage';
import PageToolbar from '@/components/layout/PageToolbar';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import TransactionStatusBadge from '@/components/transactions/TransactionStatusBadge';
import TransactionTimeline from '@/components/TransactionTimeline';
import StaggerList, { StaggerItem } from '@/components/motion/StaggerList';
import { TransactionWithDetails } from '@/types';
import { useApi } from '@/lib/swr';
import clsx from 'clsx';

function closingUrgency(transaction: TransactionWithDetails): 'overdue' | 'today' | 'soon' | null {
  if (['closed', 'cancelled', 'expired'].includes(transaction.status)) return null;
  if (!transaction.closing_date) return null;
  const daysToClosing = transaction.days_to_closing ?? 0;
  if (daysToClosing < 0) return 'overdue';
  if (daysToClosing === 0) return 'today';
  if (daysToClosing <= 7) return 'soon';
  return null;
}

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
    document.title = 'Transactions - Realestic';
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

  const getClosingIndicator = (transaction: TransactionWithDetails) => {
    if (transaction.status === 'closed' || transaction.status === 'cancelled' || transaction.status === 'expired') {
      return null;
    }

    if (!transaction.closing_date) return null;

    const daysToClosing = transaction.days_to_closing ?? 0;

    if (daysToClosing < 0) {
      return (
        <span className="flex items-center text-xs text-amber-700">
          <AlertCircle className="w-3 h-3 mr-1" />
          {Math.abs(daysToClosing)}d past closing
        </span>
      );
    }

    if (daysToClosing === 0) {
      return (
        <span className="flex items-center text-xs text-brand-600 font-medium">
          <Clock className="w-3 h-3 mr-1 animate-pulse" />
          Closing today
        </span>
      );
    }

    if (daysToClosing <= 7) {
      return (
        <span className="flex items-center text-xs text-amber-700">
          <AlertCircle className="w-3 h-3 mr-1" />
          {daysToClosing} days to closing
        </span>
      );
    }

    return (
      <span className="flex items-center text-xs text-gray-500">
        <Calendar className="w-3 h-3 mr-1" />
        {daysToClosing} days to closing
      </span>
    );
  };

  return (
    <DashboardPage title="Transactions" subtitle="Track deals, milestones, documents, and closing dates">
      <PageToolbar
        meta={!isLoading && filteredTransactions.length > 0 ? `${filteredTransactions.length} deal${filteredTransactions.length === 1 ? '' : 's'}` : undefined}
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

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white shadow-sm animate-pulse" />
          ))}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={searchTerm || statusFilter !== 'all' ? 'No matching transactions' : 'No transactions yet'}
          description={
            searchTerm || statusFilter !== 'open'
              ? 'Try adjusting your search or filters.'
              : 'Create your first transaction to track milestones, documents, and closing dates.'
          }
          action={
            !searchTerm && statusFilter === 'open' ? (
              <Link href="/dashboard/transactions/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Transaction
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <StaggerList className="space-y-3">
          {filteredTransactions.map((transaction) => {
            const urgency = closingUrgency(transaction);
            return (
              <StaggerItem key={transaction.id}>
                <Link href={`/dashboard/transactions/${transaction.id}`}>
                  <Card
                    hover
                    className={clsx(
                      'cursor-pointer border-l-4',
                      urgency === 'overdue' || urgency === 'today'
                        ? 'border-l-amber-400'
                        : urgency === 'soon'
                        ? 'border-l-brand-300'
                        : 'border-l-transparent'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {transaction.property_address}
                          </h3>
                        </div>
                        {(transaction.property_city || transaction.property_state) && (
                          <p className="text-sm text-gray-500 truncate mb-4">
                            {[transaction.property_city, transaction.property_state, transaction.property_zip]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Price</p>
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(transaction.offer_price)}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500 mb-0.5">Buyer</p>
                            <p className="text-sm font-medium text-gray-900 truncate">{transaction.buyer_name}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500 mb-0.5">Seller</p>
                            <p className="text-sm font-medium text-gray-900 truncate">{transaction.seller_name}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-0.5">Tasks</p>
                            <p className="text-sm font-medium text-gray-900">
                              {transaction.completed_items_count}/{transaction.total_items_count}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 hidden md:block">
                          <TransactionTimeline transaction={transaction} compact />
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0 gap-2">
                        <TransactionStatusBadge status={transaction.status} />
                        {getClosingIndicator(transaction)}
                        <ChevronRight className="w-4 h-4 text-gray-300 mt-2" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerList>
      )}
    </DashboardPage>
  );
}

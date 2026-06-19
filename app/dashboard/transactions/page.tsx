// Transactions List Page
// Displays all transactions with filtering and search

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Building2, DollarSign,
  Calendar, ChevronRight, AlertCircle, CheckCircle2,
  Clock, User, Users,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Header from '@/components/layout/Header';
import PageShell from '@/components/layout/PageShell';
import EmptyState from '@/components/ui/EmptyState';
import TransactionStatusBadge from '@/components/transactions/TransactionStatusBadge';
import TransactionTimeline from '@/components/TransactionTimeline';
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
    <div className="min-h-screen">
      <Header title="Transactions" subtitle="Track deals, milestones, documents, and closing dates" />
      <PageShell>
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by address, buyer, or seller..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 bg-white text-gray-900 placeholder-gray-400"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 sm:px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 bg-white text-gray-900 sm:min-w-[180px]"
              >
                <option value="open">In progress (default)</option>
                <option value="all">All deals</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="under_contract">Under contract</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <Link href="/dashboard/transactions/new" className="w-full sm:w-auto shrink-0">
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Transaction
              </Button>
            </Link>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-white border border-gray-200 rounded-xl animate-pulse" />
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
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <Link key={transaction.id} href={`/dashboard/transactions/${transaction.id}`}>
                  <Card hover className="cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-brand-50 border border-brand-100 shrink-0">
                            <Building2 className="w-5 h-5 text-brand-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {transaction.property_address}
                            </h3>
                            {(transaction.property_city || transaction.property_state) && (
                              <p className="text-sm text-gray-500 truncate">
                                {[transaction.property_city, transaction.property_state, transaction.property_zip]
                                  .filter(Boolean)
                                  .join(', ')}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="flex items-center text-sm gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400 shrink-0" />
                            <div>
                              <p className="text-gray-500 text-xs">Price</p>
                              <p className="font-semibold text-gray-900">{formatCurrency(transaction.offer_price)}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-sm gap-2">
                            <User className="w-4 h-4 text-gray-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-gray-500 text-xs">Buyer</p>
                              <p className="font-medium text-gray-900 truncate">{transaction.buyer_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-sm gap-2">
                            <Users className="w-4 h-4 text-gray-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-gray-500 text-xs">Seller</p>
                              <p className="font-medium text-gray-900 truncate">{transaction.seller_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-sm gap-2">
                            <CheckCircle2 className="w-4 h-4 text-gray-400 shrink-0" />
                            <div>
                              <p className="text-gray-500 text-xs">Tasks</p>
                              <p className="font-medium text-gray-900">
                                {transaction.completed_items_count}/{transaction.total_items_count}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 hidden md:block">
                          <TransactionTimeline transaction={transaction} compact />
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <TransactionStatusBadge status={transaction.status} />
                        <div className="mt-2">{getClosingIndicator(transaction)}</div>
                        <ChevronRight className="w-5 h-5 text-gray-300 mt-4" />
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </PageShell>
    </div>
  );
}

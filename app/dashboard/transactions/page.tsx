// Transactions List Page
// Displays all transactions with filtering and search

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, differenceInDays } from 'date-fns';
import { 
  Plus, Search, Filter, Building2, DollarSign, 
  Calendar, ChevronRight, AlertCircle, CheckCircle2,
  Clock, User, Users
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Header from '@/components/layout/Header';
import TransactionTimeline from '@/components/TransactionTimeline';
import { TransactionWithDetails } from '@/types';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Set page title
  useEffect(() => {
    document.title = 'Transactions - Realestic';
  }, []);

  // Fetch transactions
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const response = await fetch(`/api/transactions?${params.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch transactions');
      }

      setTransactions(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  // Filter transactions by search term
  const filteredTransactions = transactions.filter(transaction => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      transaction.property_address.toLowerCase().includes(search) ||
      transaction.buyer_name.toLowerCase().includes(search) ||
      transaction.seller_name.toLowerCase().includes(search) ||
      transaction.property_city?.toLowerCase().includes(search)
    );
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      pending: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
      under_contract: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      closed: 'bg-green-500/20 text-green-300 border border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-300 border border-red-500/30',
      expired: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
    };

    const labels: Record<string, string> = {
      active: 'Active',
      pending: 'Pending',
      under_contract: 'Under Contract',
      closed: 'Closed',
      cancelled: 'Cancelled',
      expired: 'Expired',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.active}`}>
        {labels[status] || status}
      </span>
    );
  };

  // Get closing status indicator
  const getClosingIndicator = (transaction: TransactionWithDetails) => {
    if (!transaction.closing_date) {
      return null;
    }

    const daysToClosing = transaction.days_to_closing || 0;

    if (daysToClosing < 0) {
      return (
        <span className="flex items-center text-xs text-green-400">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Closed
        </span>
      );
    }

    if (daysToClosing === 0) {
      return (
        <span className="flex items-center text-xs text-blue-400 font-medium">
          <Clock className="w-3 h-3 mr-1 animate-pulse" />
          Closing Today!
        </span>
      );
    }

    if (daysToClosing <= 7) {
      return (
        <span className="flex items-center text-xs text-orange-400">
          <AlertCircle className="w-3 h-3 mr-1" />
          {daysToClosing} days to closing
        </span>
      );
    }

    return (
      <span className="flex items-center text-xs text-gray-400">
        <Calendar className="w-3 h-3 mr-1" />
        {daysToClosing} days to closing
      </span>
    );
  };

  return (
    <div className="min-h-screen">
      <Header title="Transactions" subtitle="Manage your real estate transactions and track progress" />
      <div className="p-4 sm:p-6 text-white">
      <div className="space-y-4 sm:space-y-6">
        {/* Action buttons */}
        <div className="flex">
        <Link href="/dashboard/transactions/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            New Transaction
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by address, buyer, or seller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800/50 text-white placeholder-gray-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 sm:px-4 py-2 text-sm border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800/50 text-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="under_contract">Under Contract</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        /* Empty state */
        <Card className="text-center py-12">
          <Building2 className="w-12 h-12 mx-auto text-gray-500 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {searchTerm || statusFilter !== 'all' ? 'No matching transactions' : 'No transactions yet'}
          </h3>
          <p className="text-gray-400 mb-6">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first transaction to get started'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Link href="/dashboard/transactions/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Transaction
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        /* Transactions list */
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => (
            <Link key={transaction.id} href={`/dashboard/transactions/${transaction.id}`}>
              <Card className="hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer border-l-4 border-l-purple-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Property info */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg border border-gray-600/50">
                        <Building2 className="w-5 h-5 text-gray-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {transaction.property_address}
                        </h3>
                        {(transaction.property_city || transaction.property_state) && (
                          <p className="text-sm text-gray-400">
                            {[transaction.property_city, transaction.property_state, transaction.property_zip]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Transaction details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {/* Price */}
                      <div className="flex items-center text-sm">
                        <DollarSign className="w-4 h-4 text-gray-500 mr-2" />
                        <div>
                          <p className="text-gray-400">Price</p>
                          <p className="font-semibold text-white">{formatCurrency(transaction.offer_price)}</p>
                        </div>
                      </div>

                      {/* Buyer */}
                      <div className="flex items-center text-sm">
                        <User className="w-4 h-4 text-gray-500 mr-2" />
                        <div>
                          <p className="text-gray-400">Buyer</p>
                          <p className="font-medium text-white">{transaction.buyer_name}</p>
                        </div>
                      </div>

                      {/* Seller */}
                      <div className="flex items-center text-sm">
                        <Users className="w-4 h-4 text-gray-500 mr-2" />
                        <div>
                          <p className="text-gray-400">Seller</p>
                          <p className="font-medium text-white">{transaction.seller_name}</p>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="flex items-center text-sm">
                        <CheckCircle2 className="w-4 h-4 text-gray-500 mr-2" />
                        <div>
                          <p className="text-gray-400">Progress</p>
                          <p className="font-medium text-white">
                            {transaction.completed_items_count}/{transaction.total_items_count} tasks
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Timeline preview */}
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                      <TransactionTimeline transaction={transaction} compact />
                    </div>
                  </div>

                  {/* Status and arrow */}
                  <div className="flex flex-col items-end ml-4">
                    {getStatusBadge(transaction.status)}
                    <div className="mt-2">
                      {getClosingIndicator(transaction)}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 mt-4" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Summary stats */}
      {!isLoading && transactions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-700/50">
          <Card className="text-center py-4">
            <p className="text-2xl font-bold text-white">{transactions.length}</p>
            <p className="text-sm text-gray-400">Total Transactions</p>
          </Card>
          <Card className="text-center py-4">
            <p className="text-2xl font-bold text-blue-400">
              {transactions.filter(t => t.status === 'active' || t.status === 'under_contract').length}
            </p>
            <p className="text-sm text-gray-400">Active</p>
          </Card>
          <Card className="text-center py-4">
            <p className="text-2xl font-bold text-green-400">
              {transactions.filter(t => t.status === 'closed').length}
            </p>
            <p className="text-sm text-gray-400">Closed</p>
          </Card>
          <Card className="text-center py-4">
            <p className="text-2xl font-bold text-white">
              {formatCurrency(
                transactions
                  .filter(t => t.status !== 'cancelled' && t.status !== 'expired')
                  .reduce((sum, t) => sum + t.offer_price, 0)
              )}
            </p>
            <p className="text-sm text-gray-400">Total Volume</p>
          </Card>
        </div>
      )}
      </div>
      </div>
    </div>
  );
}

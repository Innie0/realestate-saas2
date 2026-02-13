// Transaction Detail Page
// Displays full transaction details with timeline, checklist, and reminders

'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  ArrowLeft, Edit2, Trash2, Building2, DollarSign, 
  User, Users, Calendar, Mail, Phone, FileText,
  Bell, CheckCircle2, Clock, AlertTriangle
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import TransactionForm from '@/components/TransactionForm';
import TransactionTimeline from '@/components/TransactionTimeline';
import TransactionChecklist from '@/components/TransactionChecklist';
import { TransactionWithDetails, TransactionReminder } from '@/types';

interface TransactionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TransactionDetailPage({ params }: TransactionDetailPageProps) {
  // Unwrap the params Promise (Next.js 16 requirement)
  const { id } = use(params);
  const router = useRouter();

  const [transaction, setTransaction] = useState<TransactionWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'checklist' | 'reminders' | 'details'>('timeline');

  // Optimistic update for checklist items
  const handleChecklistItemToggle = (itemId: string, isCompleted: boolean) => {
    if (!transaction) return;
    
    setTransaction({
      ...transaction,
      checklist_items: transaction.checklist_items?.map(item => 
        item.id === itemId 
          ? { ...item, is_completed: isCompleted, completed_at: isCompleted ? new Date().toISOString() : null }
          : item
      ) || []
    });
  };

  // Fetch transaction details
  const fetchTransaction = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/transactions/${id}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch transaction');
      }

      setTransaction(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  // Delete transaction
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this transaction? This cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete transaction');
      }

      router.push('/dashboard/transactions');
    } catch (err: any) {
      setError(err.message);
      setIsDeleting(false);
    }
  };

  // Dismiss reminder
  const dismissReminder = async (reminderId: string) => {
    try {
      await fetch('/api/transactions/reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminder_id: reminderId,
          is_dismissed: true,
        }),
      });
      fetchTransaction();
    } catch (error) {
      console.error('Error dismissing reminder:', error);
    }
  };

  // Format currency
  const formatCurrency = (amount: number | undefined | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
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
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.active}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <h2 className="text-lg font-medium text-white mb-2">Error Loading Transaction</h2>
          <p className="text-gray-400 mb-4">{error || 'Transaction not found'}</p>
          <Link href="/dashboard/transactions">
            <Button variant="outline">Back to Transactions</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Get active reminders
  const activeReminders = transaction.reminders?.filter(
    r => !r.is_dismissed && !r.is_sent && new Date(r.reminder_date) <= new Date()
  ) || [];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Header with gradient */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-gray-700/50">
        <div className="flex items-start gap-4">
          <Link 
            href="/dashboard/transactions"
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-all duration-200 mt-1"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-white">
                {transaction.property_address}
              </h1>
              {getStatusBadge(transaction.status)}
            </div>
            {(transaction.property_city || transaction.property_state) && (
              <p className="text-gray-400">
                {[transaction.property_city, transaction.property_state, transaction.property_zip]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleDelete} isLoading={isDeleting}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Active Reminders Alert */}
      {activeReminders.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start">
            <Bell className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-300">
                You have {activeReminders.length} active reminder{activeReminders.length > 1 ? 's' : ''}
              </h3>
              <div className="mt-2 space-y-2">
                {activeReminders.map(reminder => (
                  <div key={reminder.id} className="flex items-center justify-between text-sm">
                    <span className="text-yellow-200">{reminder.title}</span>
                    <button
                      onClick={() => dismissReminder(reminder.id)}
                      className="text-yellow-400 hover:text-yellow-300 underline"
                    >
                      Dismiss
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats with gradients */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center py-4 bg-gradient-to-br from-green-500/10 to-green-900/10 border border-green-500/30">
          <div className="p-2 bg-green-500/20 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center border border-green-500/30">
            <DollarSign className="w-6 h-6 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(transaction.offer_price)}</p>
          <p className="text-sm text-gray-400 font-medium">Offer Price</p>
        </Card>
        <Card className="text-center py-4 bg-gradient-to-br from-blue-500/10 to-blue-900/10 border border-blue-500/30">
          <div className="p-2 bg-blue-500/20 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center border border-blue-500/30">
            <Calendar className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {transaction.days_to_closing != null 
              ? (transaction.days_to_closing < 0 
                ? 'Closed' 
                : `${transaction.days_to_closing} days`)
              : '-'}
          </p>
          <p className="text-sm text-gray-400 font-medium">To Closing</p>
        </Card>
        <Card className="text-center py-4 bg-gradient-to-br from-purple-500/10 to-purple-900/10 border border-purple-500/30">
          <div className="p-2 bg-purple-500/20 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center border border-purple-500/30">
            <CheckCircle2 className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {transaction.completed_items_count}/{transaction.total_items_count}
          </p>
          <p className="text-sm text-gray-400 font-medium">Tasks Complete</p>
        </Card>
        <Card className="text-center py-4 bg-gradient-to-br from-gray-500/10 to-gray-900/10 border border-gray-500/30">
          <div className="p-2 bg-gray-500/20 rounded-full w-12 h-12 mx-auto mb-2 flex items-center justify-center border border-gray-500/30">
            <Clock className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-white">
            {transaction.closing_date 
              ? format(new Date(transaction.closing_date), 'MMM d')
              : '-'}
          </p>
          <p className="text-sm text-gray-400 font-medium">Closing Date</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700/50">
        <nav className="flex space-x-8">
          {[
            { id: 'timeline', label: 'Timeline', icon: Calendar },
            { id: 'checklist', label: 'Checklist', icon: CheckCircle2 },
            { id: 'reminders', label: 'Reminders', icon: Bell },
            { id: 'details', label: 'Details', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'timeline' && (
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Transaction Timeline</h2>
            <TransactionTimeline transaction={transaction} />
          </Card>
        )}

        {activeTab === 'checklist' && (
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Task Checklist</h2>
            <TransactionChecklist
              transactionId={transaction.id}
              items={transaction.checklist_items || []}
              onUpdate={fetchTransaction}
              onItemToggle={handleChecklistItemToggle}
            />
          </Card>
        )}

        {activeTab === 'reminders' && (
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Reminders</h2>
            {transaction.reminders && transaction.reminders.length > 0 ? (
              <div className="space-y-3">
                {transaction.reminders
                  .filter(r => !r.is_dismissed)
                  .map(reminder => (
                    <div 
                      key={reminder.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        reminder.is_sent ? 'bg-gray-800/30' : 'bg-yellow-500/10 border border-yellow-500/30'
                      }`}
                    >
                      <div className="flex items-center">
                        <Bell className={`w-5 h-5 mr-3 ${
                          reminder.is_sent ? 'text-gray-500' : 'text-yellow-400'
                        }`} />
                        <div>
                          <p className={`font-medium ${
                            reminder.is_sent ? 'text-gray-400' : 'text-white'
                          }`}>
                            {reminder.title}
                          </p>
                          <p className="text-sm text-gray-400">
                            {format(new Date(reminder.reminder_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      {!reminder.is_sent && (
                        <button
                          onClick={() => dismissReminder(reminder.id)}
                          className="text-sm text-gray-400 hover:text-gray-300"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No reminders set</p>
            )}
          </Card>
        )}

        {activeTab === 'details' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buyer Info */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Buyer Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Name</p>
                  <p className="font-medium text-white">{transaction.buyer_name}</p>
                </div>
                {transaction.buyer_email && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-500 mr-2" />
                    <a href={`mailto:${transaction.buyer_email}`} className="text-blue-400 hover:underline">
                      {transaction.buyer_email}
                    </a>
                  </div>
                )}
                {transaction.buyer_phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-500 mr-2" />
                    <a href={`tel:${transaction.buyer_phone}`} className="text-blue-400 hover:underline">
                      {transaction.buyer_phone}
                    </a>
                  </div>
                )}
                {transaction.buyer_agent_name && (
                  <div className="pt-3 border-t border-gray-700/50">
                    <p className="text-sm text-gray-400">Agent</p>
                    <p className="font-medium text-white">{transaction.buyer_agent_name}</p>
                    {transaction.buyer_agent_email && (
                      <p className="text-sm text-gray-400">{transaction.buyer_agent_email}</p>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Seller Info */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Seller Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Name</p>
                  <p className="font-medium text-white">{transaction.seller_name}</p>
                </div>
                {transaction.seller_email && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-500 mr-2" />
                    <a href={`mailto:${transaction.seller_email}`} className="text-blue-400 hover:underline">
                      {transaction.seller_email}
                    </a>
                  </div>
                )}
                {transaction.seller_phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-500 mr-2" />
                    <a href={`tel:${transaction.seller_phone}`} className="text-blue-400 hover:underline">
                      {transaction.seller_phone}
                    </a>
                  </div>
                )}
                {transaction.seller_agent_name && (
                  <div className="pt-3 border-t border-gray-700/50">
                    <p className="text-sm text-gray-400">Agent</p>
                    <p className="font-medium text-white">{transaction.seller_agent_name}</p>
                    {transaction.seller_agent_email && (
                      <p className="text-sm text-gray-400">{transaction.seller_agent_email}</p>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Financial Info */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Financial Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Offer Price</span>
                  <span className="font-semibold text-white">{formatCurrency(transaction.offer_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Earnest Money</span>
                  <span className="text-white">{formatCurrency(transaction.earnest_money)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Down Payment</span>
                  <span className="text-white">{formatCurrency(transaction.down_payment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Loan Amount</span>
                  <span className="text-white">{formatCurrency(transaction.loan_amount)}</span>
                </div>
              </div>
            </Card>

            {/* Notes */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Notes
              </h3>
              {transaction.notes ? (
                <p className="text-gray-300 whitespace-pre-wrap">{transaction.notes}</p>
              ) : (
                <p className="text-gray-400 italic">No notes added</p>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Transaction">
        <TransactionForm
          transaction={transaction}
          onSuccess={() => {
            setIsEditing(false);
            fetchTransaction();
          }}
          onCancel={() => setIsEditing(false)}
        />
      </Modal>
      </div>
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'reminders' | 'financials'>('overview');

  // Optimistic update for checklist items
  const handleChecklistItemToggle = (itemId: string, isCompleted: boolean) => {
    if (!transaction) return;
    
    setTransaction({
      ...transaction,
      checklist_items: transaction.checklist_items?.map(item => 
        item.id === itemId 
          ? { ...item, is_completed: isCompleted, completed_at: isCompleted ? new Date().toISOString() : undefined }
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
      expired: 'bg-gray-500/20 text-gray-600 border border-gray-500/30',
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
          <h2 className="text-lg font-medium text-gray-900 mb-2">Error Loading Transaction</h2>
          <p className="text-gray-500 mb-4">{error || 'Transaction not found'}</p>
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
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="flex items-start gap-4">
          <Link 
            href="/dashboard/transactions"
            className="p-2 hover:bg-gray-100/50 rounded-lg transition-all duration-200 mt-1"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {transaction.property_address}
              </h1>
              {getStatusBadge(transaction.status)}
            </div>
            {(transaction.property_city || transaction.property_state) && (
              <p className="text-gray-500">
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1">
          {[
            { id: 'overview', label: 'Overview', icon: Building2 },
            { id: 'tasks', label: 'Timeline & Tasks', icon: CheckCircle2 },
            { id: 'reminders', label: 'Reminders', icon: Bell },
            { id: 'financials', label: 'Financials', icon: DollarSign },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-3 px-4 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-100 text-gray-900 border-b-2 border-white'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Offer Price', value: formatCurrency(transaction.offer_price), icon: DollarSign },
                { label: 'To Closing', value: transaction.days_to_closing != null ? (transaction.days_to_closing < 0 ? 'Closed' : `${transaction.days_to_closing}d`) : '-', icon: Calendar },
                { label: 'Tasks', value: `${transaction.completed_items_count}/${transaction.total_items_count}`, icon: CheckCircle2 },
                { label: 'Closing Date', value: transaction.closing_date ? format(new Date(transaction.closing_date), 'MMM d') : '-', icon: Clock },
              ].map(stat => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} className="border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-gray-900/70" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                        <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Buyer & Seller side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" /> Buyer
                </h3>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">{transaction.buyer_name || '-'}</p>
                  {transaction.buyer_email && (
                    <a href={`mailto:${transaction.buyer_email}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                      <Mail className="w-3.5 h-3.5" /> {transaction.buyer_email}
                    </a>
                  )}
                  {transaction.buyer_phone && (
                    <a href={`tel:${transaction.buyer_phone}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                      <Phone className="w-3.5 h-3.5" /> {transaction.buyer_phone}
                    </a>
                  )}
                  {transaction.buyer_agent_name && (
                    <div className="pt-2 mt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">Agent: <span className="text-gray-600">{transaction.buyer_agent_name}</span></p>
                    </div>
                  )}
                </div>
              </Card>

              <Card>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Seller
                </h3>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">{transaction.seller_name || '-'}</p>
                  {transaction.seller_email && (
                    <a href={`mailto:${transaction.seller_email}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                      <Mail className="w-3.5 h-3.5" /> {transaction.seller_email}
                    </a>
                  )}
                  {transaction.seller_phone && (
                    <a href={`tel:${transaction.seller_phone}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                      <Phone className="w-3.5 h-3.5" /> {transaction.seller_phone}
                    </a>
                  )}
                  {transaction.seller_agent_name && (
                    <div className="pt-2 mt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500">Agent: <span className="text-gray-600">{transaction.seller_agent_name}</span></p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Notes */}
            {transaction.notes && (
              <Card>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Notes
                </h3>
                <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">{transaction.notes}</p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-base font-semibold text-gray-900 mb-4">Transaction Timeline</h2>
              <TransactionTimeline transaction={transaction} />
            </Card>
            <Card>
              <h2 className="text-base font-semibold text-gray-900 mb-4">Task Checklist</h2>
              <TransactionChecklist
                transactionId={transaction.id}
                items={transaction.checklist_items || []}
                onUpdate={fetchTransaction}
                onItemToggle={handleChecklistItemToggle}
              />
            </Card>
          </div>
        )}

        {activeTab === 'reminders' && (
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Reminders</h2>
            {transaction.reminders && transaction.reminders.filter(r => !r.is_dismissed).length > 0 ? (
              <div className="space-y-3">
                {transaction.reminders
                  .filter(r => !r.is_dismissed)
                  .map(reminder => (
                    <div 
                      key={reminder.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        reminder.is_sent ? 'bg-gray-50 border border-gray-200' : 'bg-yellow-500/10 border border-yellow-500/30'
                      }`}
                    >
                      <div className="flex items-center">
                        <Bell className={`w-5 h-5 mr-3 ${reminder.is_sent ? 'text-gray-500' : 'text-yellow-400'}`} />
                        <div>
                          <p className={`font-medium ${reminder.is_sent ? 'text-gray-500' : 'text-gray-900'}`}>{reminder.title}</p>
                          <p className="text-sm text-gray-500">{format(new Date(reminder.reminder_date), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                      {!reminder.is_sent && (
                        <button onClick={() => dismissReminder(reminder.id)} className="text-sm text-gray-500 hover:text-gray-900">
                          Dismiss
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No reminders set</p>
            )}
          </Card>
        )}

        {activeTab === 'financials' && (
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Financial Details</h2>
            <div className="divide-y divide-gray-200">
              {[
                { label: 'Offer Price', value: formatCurrency(transaction.offer_price) },
                { label: 'Earnest Money', value: formatCurrency(transaction.earnest_money) },
                { label: 'Down Payment', value: formatCurrency(transaction.down_payment) },
                { label: 'Loan Amount', value: formatCurrency(transaction.loan_amount) },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-3">
                  <span className="text-gray-500">{row.label}</span>
                  <span className="font-medium text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>
          </Card>
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

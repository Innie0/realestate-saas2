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
  Bell, CheckCircle2, Clock, AlertTriangle, ListChecks
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Surface from '@/components/ui/Surface';
import Modal from '@/components/ui/Modal';
import PageShell from '@/components/layout/PageShell';
import DashboardPage from '@/components/layout/DashboardPage';
import TransactionForm from '@/components/TransactionForm';
import TransactionTimeline from '@/components/TransactionTimeline';
import TransactionChecklist from '@/components/TransactionChecklist';
import TransactionDocuments from '@/components/TransactionDocuments';
import { TransactionWithDetails, Contract } from '@/types';
import {
  TRANSACTION_STATUSES,
  type TransactionStatus,
} from '@/lib/transaction-status';
import { revalidateTransactionsCache } from '@/lib/swr';

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
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'documents' | 'reminders' | 'financials'>('overview');
  const [prefetchedDocuments, setPrefetchedDocuments] = useState<Contract[]>([]);
  const [documentsSetupError, setDocumentsSetupError] = useState('');
  const [documentsReady, setDocumentsReady] = useState(false);

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

  const prefetchDocuments = async () => {
    try {
      const docsResponse = await fetch(`/api/transactions/${id}/documents`);
      const docsData = await docsResponse.json();

      if (docsData.success) {
        setPrefetchedDocuments(docsData.data ?? []);
        setDocumentsSetupError('');
      } else if (docsResponse.status === 503) {
        setPrefetchedDocuments([]);
        setDocumentsSetupError(docsData.error || 'Documents storage is not set up yet.');
      }
    } catch {
      // Non-fatal — documents tab can retry
    } finally {
      setDocumentsReady(true);
    }
  };

  useEffect(() => {
    document.title = transaction?.property_address
      ? `${transaction.property_address} - Oikaro`
      : 'Transaction - Oikaro';
  }, [transaction?.property_address]);

  useEffect(() => {
    setDocumentsReady(false);
    setDocumentsSetupError('');
    setPrefetchedDocuments([]);

    fetchTransaction();
    prefetchDocuments();
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

      await revalidateTransactionsCache();
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

  const handleStatusChange = async (newStatus: TransactionStatus) => {
    if (!transaction || newStatus === transaction.status) return;

    const previousStatus = transaction.status;
    setIsUpdatingStatus(true);
    setError('');
    setTransaction((prev) => (prev ? { ...prev, status: newStatus } : prev));

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update status');
      }
      setTransaction((prev) =>
        prev ? { ...prev, ...data.data, status: data.data.status as TransactionStatus } : prev
      );
      await revalidateTransactionsCache();
    } catch (err: unknown) {
      setTransaction((prev) => (prev ? { ...prev, status: previousStatus } : prev));
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const DETAIL_TABS: { id: typeof activeTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'tasks', label: 'Timeline & Tasks', icon: ListChecks },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'financials', label: 'Financials', icon: DollarSign },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (error && !transaction) {
    return (
      <div className="min-h-screen">
        <PageShell size="narrow" className="py-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Error Loading Transaction</h2>
          <p className="text-gray-700 mb-4">{error || 'Transaction not found'}</p>
          <Link href="/dashboard/transactions">
            <Button variant="outline">Back to Transactions</Button>
          </Link>
        </PageShell>
      </div>
    );
  }

  if (!transaction) return null;

  // Get active reminders
  const activeReminders = transaction.reminders?.filter(
    r => !r.is_dismissed && !r.is_sent && new Date(r.reminder_date) <= new Date()
  ) || [];

  return (
    <DashboardPage title={transaction.property_address}>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 pb-5 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <Link
                href="/dashboard/transactions"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-0.5 shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </Link>
              <div className="min-w-0">
                <h1 className="text-[22px] font-semibold text-gray-900 truncate">
                  {transaction.property_address}
                </h1>
                {(transaction.property_city || transaction.property_state) && (
                  <p className="text-gray-600 text-[13px] mt-0.5">
                    {[transaction.property_city, transaction.property_state, transaction.property_zip]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-3.5 h-3.5 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={handleDelete}
                isLoading={isDeleting}
                className="!text-rose-700 hover:!bg-rose-50 hover:!ring-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          <div className="sm:max-w-[340px]">
            <Select
              id="deal-status"
              key={transaction.status}
              label="Deal status"
              value={transaction.status}
              disabled={isUpdatingStatus || isEditing}
              onChange={(value) => handleStatusChange(value as TransactionStatus)}
              triggerClassName="w-full px-3 py-2 bg-white border border-gray-200 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50"
              options={TRANSACTION_STATUSES.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

      {/* Active Reminders Alert */}
      {activeReminders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-[10px] p-4">
          <div className="flex items-start">
            <Bell className="w-4 h-4 text-amber-700 mr-3 mt-0.5 shrink-0" />
            <div className="flex-1">
              <h3 className="text-[13px] font-medium text-amber-900">
                You have {activeReminders.length} active reminder{activeReminders.length > 1 ? 's' : ''}
              </h3>
              <div className="mt-2 space-y-2">
                {activeReminders.map(reminder => (
                  <div key={reminder.id} className="flex items-center justify-between text-[13px]">
                    <span className="text-amber-800">{reminder.title}</span>
                    <button
                      type="button"
                      onClick={() => dismissReminder(reminder.id)}
                      className="text-amber-700 hover:text-amber-900 underline"
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

      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-[26px] overflow-x-auto">
          {DETAIL_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 py-3 text-[13px] font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'text-gray-900' : 'text-gray-600 hover:text-gray-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-500" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Offer Price', value: formatCurrency(transaction.offer_price), icon: DollarSign },
                { label: 'To Closing', value: (() => {
                  if (transaction.status === 'closed') return 'Deal closed';
                  if (transaction.status === 'cancelled') return 'Cancelled';
                  if (transaction.status === 'expired') return 'Expired';
                  if (transaction.days_to_closing == null) return '-';
                  if (transaction.days_to_closing < 0) return `${Math.abs(transaction.days_to_closing)}d past closing`;
                  if (transaction.days_to_closing === 0) return 'Today';
                  return `${transaction.days_to_closing}d`;
                })(), icon: Calendar },
                { label: 'Tasks', value: `${transaction.completed_items_count}/${transaction.total_items_count}`, icon: CheckCircle2 },
                { label: 'Closing Date', value: transaction.closing_date ? format(new Date(transaction.closing_date), 'MMM d') : '-', icon: Clock },
              ].map(stat => {
                const Icon = stat.icon;
                return (
                  <Surface key={stat.label} flat className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-[34px] h-[34px] rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-gray-900" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11.5px] text-gray-600">{stat.label}</p>
                        <p className="text-[17px] font-semibold text-gray-900 truncate">{stat.value}</p>
                      </div>
                    </div>
                  </Surface>
                );
              })}
            </div>

            {/* Buyer & Seller side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Surface flat className="p-5 sm:p-[22px]">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.1em] text-gray-600 mb-3 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Buyer
                </h3>
                <p className="text-[17px] font-semibold text-gray-900 mb-2">{transaction.buyer_name || '-'}</p>
                <div className="space-y-1.5">
                  {transaction.buyer_email && (
                    <a href={`mailto:${transaction.buyer_email}`} className="flex items-center gap-2 text-[13px] text-gray-700 hover:text-brand-600 transition-colors">
                      <Mail className="w-3.5 h-3.5 text-gray-600" /> {transaction.buyer_email}
                    </a>
                  )}
                  {transaction.buyer_phone && (
                    <a href={`tel:${transaction.buyer_phone}`} className="flex items-center gap-2 text-[13px] text-gray-700 hover:text-brand-600 transition-colors">
                      <Phone className="w-3.5 h-3.5 text-gray-600" /> {transaction.buyer_phone}
                    </a>
                  )}
                </div>
                {transaction.buyer_agent_name && (
                  <div className="pt-3 mt-3 border-t border-gray-150">
                    <p className="text-[12.5px] text-gray-700">Agent: <span className="font-medium text-gray-900">{transaction.buyer_agent_name}</span></p>
                  </div>
                )}
              </Surface>

              <Surface flat className="p-5 sm:p-[22px]">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.1em] text-gray-600 mb-3 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Seller
                </h3>
                <p className="text-[17px] font-semibold text-gray-900 mb-2">{transaction.seller_name || '-'}</p>
                <div className="space-y-1.5">
                  {transaction.seller_email && (
                    <a href={`mailto:${transaction.seller_email}`} className="flex items-center gap-2 text-[13px] text-gray-700 hover:text-brand-600 transition-colors">
                      <Mail className="w-3.5 h-3.5 text-gray-600" /> {transaction.seller_email}
                    </a>
                  )}
                  {transaction.seller_phone && (
                    <a href={`tel:${transaction.seller_phone}`} className="flex items-center gap-2 text-[13px] text-gray-700 hover:text-brand-600 transition-colors">
                      <Phone className="w-3.5 h-3.5 text-gray-600" /> {transaction.seller_phone}
                    </a>
                  )}
                </div>
                {transaction.seller_agent_name && (
                  <div className="pt-3 mt-3 border-t border-gray-150">
                    <p className="text-[12.5px] text-gray-700">Agent: <span className="font-medium text-gray-900">{transaction.seller_agent_name}</span></p>
                  </div>
                )}
              </Surface>
            </div>

            {/* Notes */}
            {transaction.notes && (
              <Surface flat className="p-5 sm:p-[22px]">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.1em] text-gray-600 mb-3 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Notes
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap text-[13.5px] leading-relaxed">{transaction.notes}</p>
              </Surface>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-5">
            <Surface flat className="p-5 sm:p-[22px]">
              <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Transaction Timeline</h2>
              <TransactionTimeline transaction={transaction} />
            </Surface>
            <Surface flat className="p-5 sm:p-[22px]">
              <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Task Checklist</h2>
              <TransactionChecklist
                transactionId={transaction.id}
                items={transaction.checklist_items || []}
                onUpdate={fetchTransaction}
                onItemToggle={handleChecklistItemToggle}
              />
            </Surface>
          </div>
        )}

        <div className={activeTab === 'documents' ? '' : 'hidden'}>
          <Surface flat className="p-5 sm:p-[22px]">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-1">Deal Documents</h2>
            <p className="text-[13px] text-gray-600 mb-5">
              Store contracts, disclosures, inspection reports, and other files for this transaction.
            </p>
            <TransactionDocuments
              transactionId={transaction.id}
              prefetchedDocuments={prefetchedDocuments}
              prefetchedSetupError={documentsSetupError}
              documentsReady={documentsReady}
            />
          </Surface>
        </div>

        {activeTab === 'reminders' && (
          <Surface flat className="p-5 sm:p-[22px]">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Reminders</h2>
            {transaction.reminders && transaction.reminders.filter(r => !r.is_dismissed).length > 0 ? (
              <div className="space-y-2.5">
                {transaction.reminders
                  .filter(r => !r.is_dismissed)
                  .map(reminder => (
                    <div
                      key={reminder.id}
                      className="flex items-center justify-between p-3.5 rounded-[10px] border border-gray-150 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                          <Bell className="w-4 h-4 text-gray-700" />
                        </span>
                        <div>
                          <p className="text-[13.5px] font-medium text-gray-700">{reminder.title}</p>
                          <p className="text-[11.5px] text-gray-600 mt-0.5">{format(new Date(reminder.reminder_date), 'MMM d, yyyy')}</p>
                        </div>
                      </div>
                      {!reminder.is_sent && (
                        <button onClick={() => dismissReminder(reminder.id)} className="text-[12.5px] text-gray-600 hover:text-gray-900 transition-colors">
                          Dismiss
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-600 text-[13px] text-center py-8">No reminders set</p>
            )}
          </Surface>
        )}

        {activeTab === 'financials' && (
          <Surface flat className="p-5 sm:p-[22px]">
            <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Financial Details</h2>
            <div className="divide-y divide-gray-150">
              {[
                { label: 'Offer Price', value: formatCurrency(transaction.offer_price) },
                { label: 'Earnest Money', value: formatCurrency(transaction.earnest_money) },
                { label: 'Down Payment', value: formatCurrency(transaction.down_payment) },
                { label: 'Loan Amount', value: formatCurrency(transaction.loan_amount) },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-3.5">
                  <span className="text-[13.5px] text-gray-700">{row.label}</span>
                  <span className="text-[16px] font-semibold text-gray-900">{row.value}</span>
                </div>
              ))}
            </div>
          </Surface>
        )}
      </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Transaction" size="lg">
        <TransactionForm
          transaction={transaction}
          onSuccess={() => {
            setIsEditing(false);
            fetchTransaction();
          }}
          onCancel={() => setIsEditing(false)}
        />
      </Modal>
    </DashboardPage>
  );
}

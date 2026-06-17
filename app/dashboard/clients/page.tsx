'use client';

import { useState, useEffect, useMemo } from 'react';
import { Client } from '@/types';
import ClientCard from '@/components/ClientCard';
import ClientForm from '@/components/ClientForm';
import ReminderForm from '@/components/ReminderForm';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Header from '@/components/layout/Header';
import PageShell from '@/components/layout/PageShell';
import EmptyState from '@/components/ui/EmptyState';
import { Search, Plus, X, Users } from 'lucide-react';
import { useTour } from '@/hooks/useTour';
import { useApi } from '@/lib/swr';

/**
 * Clients page - CRM client management
 */
export default function ClientsPage() {
  useTour({
    tourKey: 'tour_clients',
    steps: [
      {
        element: '[data-tour="clients-search"]',
        popover: {
          title: '🔍 Search Your CRM',
          description: 'Quickly find any client by name or email. Results update as you type.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="clients-filter"]',
        popover: {
          title: '📂 Filter by Status',
          description: 'View active clients, archived ones, or your full list. Keep your CRM clean by archiving closed deals.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="clients-add"]',
        popover: {
          title: '➕ Add a Client',
          description: 'Manually add a client directly to your CRM. Leads from your form or open house sign-in go to the Leads inbox instead.',
          side: 'bottom',
        },
      },
    ],
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const clientsUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (statusFilter) params.append('status', statusFilter);
    const qs = params.toString();
    return `/api/clients${qs ? `?${qs}` : ''}`;
  }, [searchQuery, statusFilter]);

  const { data: clients = [], isLoading, mutate } = useApi<Client[]>(clientsUrl);

  // Quick add modals
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [noteText, setNoteText] = useState('');

  // Set page title
  useEffect(() => {
    document.title = 'Clients - Realestic';
  }, []);

  const handleCreateClient = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setShowCreateForm(false);
        mutate();
      } else {
        alert(result.error || 'Failed to create client');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Failed to create client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = async (client: Client) => {
    setSelectedClient(client);
    setNoteText('');
    setShowNoteModal(true);
  };

  const handleAddReminder = (client: Client) => {
    setSelectedClient(client);
    setShowReminderModal(true);
  };

  const submitNote = async () => {
    if (!selectedClient || !noteText.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/clients/${selectedClient.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText }),
      });

      const result = await response.json();

      if (result.success) {
        setShowNoteModal(false);
        setNoteText('');
        setSelectedClient(null);
        // Refresh clients list to show the new note
        mutate();
      } else {
        alert(result.error || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitReminder = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setShowReminderModal(false);
        setSelectedClient(null);
        // Refresh clients list to show the new reminder count
        mutate();
      } else {
        alert(result.error || 'Failed to create reminder');
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      alert('Failed to create reminder');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Clients" subtitle="Manage your client relationships and follow-ups" />
      <PageShell>

      {/* Filters and search */}
      <div className="mb-6 flex flex-col gap-3 sm:gap-4">
        {/* Search bar */}
        <div data-tour="clients-search" className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600 z-10" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30 text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* Status filter and Create button */}
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            data-tour="clients-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 focus:outline-none"
          >
            <option value="all" className="bg-gray-100 text-gray-900">All Clients</option>
            <option value="active" className="bg-gray-100 text-gray-900">Active</option>
            <option value="inactive" className="bg-gray-100 text-gray-900">Inactive</option>
            <option value="archived" className="bg-gray-100 text-gray-900">Archived</option>
          </select>

          {/* Create button */}
          <Button
            data-tour="clients-add"
            variant="primary"
            size="md"
            onClick={() => setShowCreateForm(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Client
          </Button>
        </div>
      </div>

      {/* Create form modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl border border-gray-200 p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto bg-white">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">New Client</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500 hover:text-brand-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <ClientForm
              onSubmit={handleCreateClient}
              onCancel={() => setShowCreateForm(false)}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Clients grid */}
      {isLoading && clients.length === 0 ? (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-gray-200 p-6 shadow bg-white">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start tracking notes, reminders, and transactions."
          action={
            <Button variant="primary" size="md" onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Client
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              onAddNote={() => handleAddNote(client)}
              onAddReminder={() => handleAddReminder(client)}
            />
          ))}
        </div>
      )}

      {/* Quick Add Note Modal */}
      {showNoteModal && selectedClient && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl border border-gray-200 p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Add Note for {selectedClient.name}
              </h2>
              <button
                onClick={() => setShowNoteModal(false)}
                className="text-gray-500 hover:text-gray-600 flex-shrink-0 ml-2"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your note..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={submitNote}
                disabled={isSubmitting || !noteText.trim()}
              >
                {isSubmitting ? 'Saving...' : 'Save Note'}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowNoteModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Reminder Modal */}
      {showReminderModal && selectedClient && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl border border-gray-200 p-6 max-w-md w-full bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Add Reminder for {selectedClient.name}
              </h2>
              <button
                onClick={() => setShowReminderModal(false)}
                className="text-gray-500 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <ReminderForm
              clientId={selectedClient.id}
              onSubmit={submitReminder}
              onCancel={() => setShowReminderModal(false)}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      )}
      </PageShell>
    </div>
  );
}







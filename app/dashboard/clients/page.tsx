'use client';

import { useState, useEffect, useMemo } from 'react';
import { Client } from '@/types';
import ClientCard from '@/components/ClientCard';
import ClientForm from '@/components/ClientForm';
import ReminderForm from '@/components/ReminderForm';
import Button from '@/components/ui/Button';
import DashboardPage from '@/components/layout/DashboardPage';
import PageToolbar from '@/components/layout/PageToolbar';
import SearchInput from '@/components/ui/SearchInput';
import EmptyState from '@/components/ui/EmptyState';
import { Plus, X, Users } from 'lucide-react';
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
    <DashboardPage title="Clients" subtitle="Manage your client relationships and follow-ups">
      <PageToolbar meta={clients.length > 0 ? `${clients.length} client${clients.length === 1 ? '' : 's'}` : undefined}>
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
          <SearchInput
            data-tour="clients-search"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            data-tour="clients-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="field-select sm:min-w-[140px]"
          >
            <option value="all">All clients</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <Button
          data-tour="clients-add"
          onClick={() => setShowCreateForm(true)}
          className="w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Client
        </Button>
      </PageToolbar>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto bg-white">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">New Client</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
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
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Add note for {selectedClient.name}
              </h2>
              <button
                onClick={() => setShowNoteModal(false)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your note..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 mb-4"
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
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-xl p-6 max-w-md w-full bg-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Add reminder for {selectedClient.name}
              </h2>
              <button
                onClick={() => setShowReminderModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
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
    </DashboardPage>
  );
}







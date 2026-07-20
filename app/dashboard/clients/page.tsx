'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Client } from '@/types';
import ClientCard from '@/components/ClientCard';
import ClientForm from '@/components/ClientForm';
import ClientsTable from '@/components/clients/ClientsTable';
import ReminderForm from '@/components/ReminderForm';
import Button from '@/components/ui/Button';
import DashboardPage from '@/components/layout/DashboardPage';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { Plus, Users, LayoutGrid, List } from 'lucide-react';
import { useTour } from '@/hooks/useTour';
import { useApi } from '@/lib/swr';
import { useToast } from '@/components/providers/ToastProvider';
import {
  type ClientListRow,
  type ClientSortKey,
  type ClientStatusTab,
  countNeedsAttention,
  filterClientsBySearch,
  filterClientsByStatusTab,
  sortClients,
} from '@/lib/client-crm-display';
import clsx from 'clsx';

const PAGE_SIZE = 10;

const STATUS_TABS: { id: ClientStatusTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'lead', label: 'Lead' },
  { id: 'active', label: 'Active' },
  { id: 'closed', label: 'Closed' },
];

function getEmptyStateCopy(
  tab: ClientStatusTab,
  totalCount: number,
  hasSearch: boolean
): { title: string; description: string; showCreateButton: boolean; showViewAll: boolean } {
  if (hasSearch) {
    const searchTitles: Record<ClientStatusTab, string> = {
      all: 'No clients match your search',
      lead: 'No leads match your search',
      active: 'No active clients match your search',
      closed: 'No closed clients match your search',
    };
    return {
      title: searchTitles[tab],
      description: 'Try a different name, email, or phone number.',
      showCreateButton: false,
      showViewAll: false,
    };
  }

  if (tab === 'lead') {
    return {
      title: 'No leads yet',
      description:
        totalCount > 0
          ? 'You have clients in your CRM, but none are in the Lead stage.'
          : 'Add your first client to start tracking notes, reminders, and transactions.',
      showCreateButton: totalCount === 0,
      showViewAll: totalCount > 0,
    };
  }

  if (tab === 'active') {
    return {
      title: 'No active clients yet',
      description:
        totalCount > 0
          ? 'You have clients in your CRM, but none are marked active.'
          : 'Add your first client to start tracking notes, reminders, and transactions.',
      showCreateButton: totalCount === 0,
      showViewAll: totalCount > 0,
    };
  }

  if (tab === 'closed') {
    return {
      title: 'No closed clients yet',
      description:
        totalCount > 0
          ? 'When you archive a client, they will appear here.'
          : 'Add your first client to start tracking notes, reminders, and transactions.',
      showCreateButton: totalCount === 0,
      showViewAll: totalCount > 0,
    };
  }

  return {
    title: 'No clients yet',
    description: 'Add your first client to start tracking notes, reminders, and transactions.',
    showCreateButton: true,
    showViewAll: false,
  };
}

export default function ClientsPage() {
  const toast = useToast();
  useTour({
    tourKey: 'tour_clients',
    steps: [
      {
        element: '[data-tour="clients-search"]',
        popover: {
          title: 'Search your CRM',
          description: 'Find clients by name, email, or phone.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="clients-filter"]',
        popover: {
          title: 'Filter by stage',
          description: 'View leads, active clients, or closed deals.',
          side: 'bottom',
        },
      },
      {
        element: '[data-tour="clients-add"]',
        popover: {
          title: 'Add a client',
          description: 'Manually add someone to your CRM.',
          side: 'bottom',
        },
      },
    ],
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<ClientStatusTab>('all');
  const [sortKey, setSortKey] = useState<ClientSortKey>('followup');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [page, setPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: allClients = [], isLoading, mutate } = useApi<ClientListRow[]>(
    '/api/clients?status=all'
  );

  const filteredClients = useMemo(
    () =>
      filterClientsBySearch(
        filterClientsByStatusTab(allClients, statusTab),
        searchQuery
      ),
    [allClients, statusTab, searchQuery]
  );

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    document.title = 'Clients - Oikaro';
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusTab, sortKey]);

  const sortedClients = useMemo(
    () => sortClients(filteredClients, sortKey),
    [filteredClients, sortKey]
  );
  const totalPages = Math.max(1, Math.ceil(sortedClients.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedClients = sortedClients.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalCount = allClients.length;
  const attentionCount = countNeedsAttention(allClients);

  const subtitle =
    totalCount > 0
      ? attentionCount > 0
        ? `Manage relationships and follow-ups · ${attentionCount} need attention`
        : `Manage relationships and follow-ups · ${totalCount} client${totalCount === 1 ? '' : 's'}`
      : 'Manage relationships and follow-ups';

  const handleCreateClient = async (data: { name: string; email?: string; phone?: string }) => {
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
        toast.success('Client added to your CRM');
      } else {
        toast.error(result.error || 'Failed to create client');
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast.error('Failed to create client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNote = (client: Client) => {
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
        mutate();
      } else {
        toast.error(result.error || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitReminder = async (data: Record<string, unknown>) => {
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
        mutate();
      } else {
        toast.error(result.error || 'Failed to create reminder');
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast.error('Failed to create reminder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showingFrom = sortedClients.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(safePage * PAGE_SIZE, sortedClients.length);

  const emptyState = useMemo(
    () => getEmptyStateCopy(statusTab, totalCount, Boolean(searchQuery.trim())),
    [statusTab, totalCount, searchQuery]
  );

  return (
    <DashboardPage
      title="Clients"
      subtitle={subtitle}
      actions={
        <Button data-tour="clients-add" onClick={() => setShowCreateForm(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Client
        </Button>
      }
    >
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <SearchInput
            data-tour="clients-search"
            placeholder="Search name, email, phone…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            containerClassName="lg:max-w-md"
          />

          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <div
              data-tour="clients-filter"
              className="relative inline-flex rounded-lg bg-gray-100 p-1"
            >
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusTab(tab.id)}
                  className={clsx(
                    'relative px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors z-10',
                    statusTab === tab.id ? 'text-white' : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  {statusTab === tab.id && (
                    <motion.span
                      layoutId="clients-status-pill"
                      className="absolute inset-0 rounded-lg bg-brand-500 -z-10"
                      transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    />
                  )}
                  {tab.label}
                </button>
              ))}
            </div>

            <Select
              value={sortKey}
              onChange={(value) => setSortKey(value as ClientSortKey)}
              className="w-[152px]"
              triggerClassName="py-2 text-[13px]"
              options={[
                { value: 'followup', label: 'Sort: Follow-up' },
                { value: 'name', label: 'Sort: Name' },
                { value: 'last_contact', label: 'Sort: Last contact' },
              ]}
            />

            <div className="inline-flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={clsx(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'list' ? 'bg-[var(--surface)] text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-700'
                )}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={clsx(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'grid' ? 'bg-[var(--surface)] text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-700'
                )}
                aria-label="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showCreateForm} onClose={() => setShowCreateForm(false)} title="New Client" size="md">
        <ClientForm
          onSubmit={handleCreateClient}
          onCancel={() => setShowCreateForm(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      {isLoading && allClients.length === 0 ? (
        <div className="rounded-[10px] border border-gray-200 bg-[var(--surface)] overflow-hidden animate-pulse">
          <div className="h-12 bg-gray-50 border-b border-gray-150" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 border-b border-gray-150 px-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-40" />
                <div className="h-2.5 bg-gray-100 rounded w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedClients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={emptyState.title}
          description={emptyState.description}
          action={
            emptyState.showCreateButton ? (
              <Button variant="primary" size="md" onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Client
              </Button>
            ) : emptyState.showViewAll ? (
              <Button variant="outline" size="md" onClick={() => setStatusTab('all')}>
                View all clients
              </Button>
            ) : undefined
          }
        />
      ) : viewMode === 'list' ? (
        <>
          <ClientsTable clients={pagedClients} />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[13px] text-gray-600">
            <p>
              Showing {showingFrom}–{showingTo} of {sortedClients.length} client
              {sortedClients.length === 1 ? '' : 's'}
              {statusTab !== 'all' || searchQuery
                ? ` (${totalCount} total)`
                : null}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {pagedClients.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onAddNote={() => handleAddNote(client)}
                onAddReminder={() => handleAddReminder(client)}
              />
            ))}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[13px] text-gray-600">
            <p>
              Showing {showingFrom}–{showingTo} of {sortedClients.length} client
              {sortedClients.length === 1 ? '' : 's'}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <Modal
        isOpen={showNoteModal && !!selectedClient}
        onClose={() => setShowNoteModal(false)}
        title={`Add note for ${selectedClient?.name ?? ''}`}
        size="sm"
      >
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Enter your note..."
          rows={4}
          className="w-full px-3 py-2.5 rounded-[10px] border border-gray-200 bg-gray-50 text-[13px] text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 mb-4"
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
      </Modal>

      <Modal
        isOpen={showReminderModal && !!selectedClient}
        onClose={() => setShowReminderModal(false)}
        title={`Add reminder for ${selectedClient?.name ?? ''}`}
        size="sm"
      >
        {selectedClient && (
          <ReminderForm
            clientId={selectedClient.id}
            onSubmit={submitReminder}
            onCancel={() => setShowReminderModal(false)}
            isLoading={isSubmitting}
          />
        )}
      </Modal>
    </DashboardPage>
  );
}

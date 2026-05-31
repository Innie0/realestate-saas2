'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@/types';
import { supabase } from '@/lib/supabase';
import ClientCard from '@/components/ClientCard';
import ClientForm from '@/components/ClientForm';
import ReminderForm from '@/components/ReminderForm';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Header from '@/components/layout/Header';
import { Search, Plus, X, Link2, Copy, Check } from 'lucide-react';

/**
 * Clients page - CRM client management
 */
export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Quick add modals
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [noteText, setNoteText] = useState('');

  // Set page title
  useEffect(() => {
    document.title = 'Clients - Realestic';
  }, []);

  // Share lead form link
  const [showShareModal, setShowShareModal] = useState(false);
  const [leadFormUrl, setLeadFormUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Fetch clients
  useEffect(() => {
    fetchClients();
  }, [searchQuery, statusFilter]);

  // Build the agent's public lead form URL from their user id
  useEffect(() => {
    const loadLeadFormUrl = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setLeadFormUrl(`${window.location.origin}/lead/${user.id}`);
      }
    };
    loadLeadFormUrl();
  }, []);

  const handleCopyLink = async () => {
    if (!leadFormUrl) return;
    try {
      await navigator.clipboard.writeText(leadFormUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/clients?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setClients(result.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

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
        fetchClients();
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
        fetchClients();
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
        fetchClients();
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
      <div className="p-4 sm:p-6 text-white">

      {/* Filters and search */}
      <div className="mb-6 flex flex-col gap-3 sm:gap-4">
        {/* Search bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300 z-10" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#111111] border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder-gray-500"
          />
        </div>

        {/* Status filter and Create button */}
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 sm:px-4 py-2 text-sm border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:outline-none"
          >
            <option value="all" className="bg-gray-800 text-white">All Clients</option>
            <option value="active" className="bg-gray-800 text-white">Active</option>
            <option value="inactive" className="bg-gray-800 text-white">Inactive</option>
            <option value="archived" className="bg-gray-800 text-white">Archived</option>
          </select>

          {/* Share lead form button */}
          <Button
            variant="white"
            size="md"
            onClick={() => setShowShareModal(true)}
            className="w-full sm:w-auto"
          >
            <Link2 className="w-4 h-4 mr-2" />
            Share Lead Form
          </Button>

          {/* Create button */}
          <Button
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl border border-white/10 p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto bg-[#111111]">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-800">
              <h2 className="text-lg sm:text-xl font-bold text-white">New Client</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white transition-colors"
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

      {/* Share Lead Form modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] rounded-xl border border-white/10 p-6 max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Link2 className="w-4 h-4 text-white/70" />
                </div>
                <h2 className="text-lg font-bold text-white">Share Lead Form</h2>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-b border-white/10 my-4" />

            <p className="text-gray-400 text-sm mb-5">
              Share this link anywhere — your Instagram bio, email signature, or
              business cards. Anyone who fills it out is added straight to your
              clients list as a new lead.
            </p>

            {/* Link + copy */}
            <div className="flex items-center gap-2 mb-5">
              <input
                type="text"
                readOnly
                value={leadFormUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 cursor-text"
              />
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  copied
                    ? 'bg-white/10 text-white border-white/20'
                    : 'bg-white text-gray-900 hover:bg-gray-100 border-gray-200'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>

            {leadFormUrl && (
              <a
                href={leadFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <Link2 className="w-3.5 h-3.5" />
                Preview the form
              </a>
            )}
          </div>
        </div>
      )}

      {/* Clients grid */}
      {loading ? (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-white/10 p-6 shadow bg-[#111111]">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No clients found</p>
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Client
          </Button>
        </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl border border-white/10 p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto bg-[#111111]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Add Note for {selectedClient.name}
              </h2>
              <button
                onClick={() => setShowNoteModal(false)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your note..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 mb-4"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl border border-white/10 p-6 max-w-md w-full bg-[#111111]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                Add Reminder for {selectedClient.name}
              </h2>
              <button
                onClick={() => setShowReminderModal(false)}
                className="text-gray-400 hover:text-gray-600"
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
      </div>
    </div>
  );
}







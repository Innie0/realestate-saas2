'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ClientWithDetails, Reminder } from '@/types';
import ClientForm from '@/components/ClientForm';
import ReminderForm from '@/components/ReminderForm';
import Button from '@/components/ui/Button';
import Surface from '@/components/ui/Surface';
import Modal from '@/components/ui/Modal';
import DashboardPage from '@/components/layout/DashboardPage';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  Clock,
  CheckCircle2,
  FileText,
  Calendar,
  Mail,
  Phone,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/providers/ToastProvider';
import {
  STAGE_BADGE,
  CLIENT_STATUS_LABEL,
  formatLastContact,
  getClientAvatarClass,
  getClientDetailFields,
  getClientInitials,
  getClientStage,
} from '@/lib/client-crm-display';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 items-center justify-between">
      <span className="text-[13px] text-gray-600">{label}</span>
      <span className="text-[13px] font-semibold text-gray-900">{value}</span>
    </div>
  );
}

/**
 * Client detail page
 * View and manage a single client with notes and reminders
 */
export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise (Next.js 16 requirement)
  const { id: clientId } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [client, setClient] = useState<ClientWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addingToCrm, setAddingToCrm] = useState(false);

  useEffect(() => {
    fetchClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const handleAddToCrm = async () => {
    setAddingToCrm(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/add-to-crm`, { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        fetchClient();
      } else {
        toast.error(result.error || 'Could not add to CRM');
      }
    } catch (error) {
      console.error('Add to CRM error:', error);
      toast.error('Could not add to CRM');
    } finally {
      setAddingToCrm(false);
    }
  };

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      const result = await response.json();

      if (result.success) {
        setClient(result.data);
      } else {
        router.push('/dashboard/clients');
      }
    } catch (error) {
      console.error('Error fetching client:', error);
      router.push('/dashboard/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClient = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setIsEditing(false);
        fetchClient();
      } else {
        toast.error(result.error || 'Failed to update client');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!confirm('Are you sure you want to delete this client? This will also delete all notes and reminders.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/clients');
      } else {
        toast.error('Failed to delete client');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
      setIsDeleting(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote }),
      });

      const result = await response.json();

      if (result.success) {
        setNewNote('');
        setShowNoteForm(false);
        fetchClient();
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

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchClient();
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleEditNote = (noteId: string, currentNote: string) => {
    setEditingNoteId(noteId);
    setEditingNoteContent(currentNote);
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: editingNoteContent }),
      });

      const result = await response.json();

      if (result.success) {
        setEditingNoteId(null);
        setEditingNoteContent('');
        fetchClient();
      } else {
        toast.error(result.error || 'Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const handleCreateReminder = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setShowReminderForm(false);
        fetchClient();
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

  const handleUpdateReminder = async (reminderId: string, data: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          reminder_date: data.reminder_date,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setEditingReminderId(null);
        fetchClient();
      } else {
        toast.error(result.error || 'Failed to update reminder');
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast.error('Failed to update reminder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteReminder = async (reminderId: string) => {
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: true }),
      });

      if (response.ok) {
        fetchClient();
      }
    } catch (error) {
      console.error('Error completing reminder:', error);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    try {
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchClient();
      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  if (loading) {
    return (
      <DashboardPage title="Client" inline>
        <div className="animate-pulse space-y-5">
          <div className="h-4 bg-gray-100 rounded w-32" />
          <div className="h-[176px] rounded-[10px] bg-white border border-gray-200" />
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
            <div className="space-y-5">
              <div className="h-40 rounded-[10px] bg-white border border-gray-200" />
              <div className="h-40 rounded-[10px] bg-white border border-gray-200" />
            </div>
            <div className="h-[336px] rounded-[10px] bg-white border border-gray-200" />
          </div>
        </div>
      </DashboardPage>
    );
  }

  if (!client) {
    return null;
  }

  const stage = getClientStage(client);
  const stageStyle = STAGE_BADGE[stage];
  const detail = getClientDetailFields(client);
  const lastContactAt = client.notes?.[0]?.created_at || client.updated_at || client.created_at;
  const reminders: Reminder[] = client.reminders || [];

  return (
    <DashboardPage title={client.name} subtitle={client.email || client.phone || undefined} inline>
      <div className="space-y-5">
        <button
          onClick={() => router.push(client.in_crm ? '/dashboard/clients' : '/dashboard/leads')}
          className="inline-flex items-center gap-1.5 text-[13px] text-gray-450 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {client.in_crm ? 'Back to Clients' : 'Back to Leads inbox'}
        </button>

        {!client.in_crm && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3.5">
            <p className="text-[13px] text-amber-900">
              This lead is in your inbox only — add them to your CRM to manage them with your full client list.
            </p>
            <Button variant="primary" size="sm" onClick={handleAddToCrm} disabled={addingToCrm}>
              {addingToCrm ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding…</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" /> Add to CRM</>
              )}
            </Button>
          </div>
        )}

        {/* Hero card */}
        <Surface flat padding="none" className="p-5 sm:p-[26px]">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold shrink-0 ${getClientAvatarClass(client.name)}`}
              >
                {getClientInitials(client.name) || '?'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-[24px] font-semibold text-gray-900 truncate">{client.name}</h1>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium border ${stageStyle.className}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${stageStyle.dotClassName}`} />
                    {stageStyle.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[13px] text-gray-600">
                  {client.email && (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-450" />
                      {client.email}
                    </span>
                  )}
                  {client.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-450" />
                      {client.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteClient}
                disabled={isDeleting}
                className="whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                {isDeleting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-gray-150">
            <div>
              <p className="text-[11px] text-gray-450">Interested in</p>
              <p className="mt-1 text-[14px] font-semibold text-gray-900">{detail.interestType}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-450">Budget</p>
              <p className="mt-1 text-[14px] font-semibold text-gray-900">{detail.budget || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-450">Area</p>
              <p className="mt-1 text-[14px] font-semibold text-gray-900">{detail.area || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-450">Timeline</p>
              <p className="mt-1 text-[14px] font-semibold text-gray-900">{detail.timeline || '—'}</p>
            </div>
          </div>
        </Surface>

        {/* Edit Client modal */}
        <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Client" size="md">
          <ClientForm
            client={client}
            onSubmit={handleUpdateClient}
            onCancel={() => setIsEditing(false)}
            isLoading={isSubmitting}
          />
        </Modal>

        {/* Two-column body */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 items-stretch">
          {/* Left column: Notes + Reminders stacked */}
          <div className="flex flex-col gap-5">
            {/* Notes card */}
            <Surface flat padding="none" className="p-5 sm:p-[22px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-700" />
                  <h2 className="text-[15px] font-semibold text-gray-900">Notes</h2>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowNoteForm(!showNoteForm)}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Note
                </Button>
              </div>

              {showNoteForm && (
                <div className="mb-4 p-4 rounded-[10px] border border-gray-150 bg-gray-50">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter your note..."
                    rows={3}
                    autoFocus
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-900 placeholder-gray-450 focus:ring-2 focus:ring-brand-500/30 focus:outline-none resize-none"
                  />
                  <div className="flex gap-2 mt-3">
                    <Button variant="primary" size="sm" onClick={handleAddNote} disabled={isSubmitting || !newNote.trim()}>
                      Save Note
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowNoteForm(false);
                        setNewNote('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {client.notes && client.notes.length > 0 ? (
                  client.notes.map((note) => (
                    <div key={note.id} className="relative p-3.5 rounded-[10px] bg-gray-50">
                      {editingNoteId === note.id ? (
                        <div>
                          <textarea
                            value={editingNoteContent}
                            onChange={(e) => setEditingNoteContent(e.target.value)}
                            rows={3}
                            autoFocus
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-[13px] text-gray-900 placeholder-gray-450 focus:ring-2 focus:ring-brand-500/30 focus:outline-none resize-none"
                          />
                          <div className="flex gap-2 mt-3">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleUpdateNote(note.id)}
                              disabled={isSubmitting || !editingNoteContent.trim()}
                            >
                              Save
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleCancelEditNote} disabled={isSubmitting}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="absolute top-3 right-3 flex gap-1">
                            <button
                              onClick={() => handleEditNote(note.id, note.note)}
                              className="p-1 rounded-md text-gray-450 hover:text-gray-700 hover:bg-gray-200/70 transition-colors"
                              title="Edit note"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 rounded-md text-gray-450 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[13.5px] text-gray-700 whitespace-pre-wrap pr-14">{note.note}</p>
                          <p className="text-[11.5px] text-gray-450 mt-2">
                            {new Date(note.created_at).toLocaleString()}
                          </p>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-[13px] text-gray-450">No notes yet</p>
                )}
              </div>
            </Surface>

            {/* Reminders card */}
            <Surface flat padding="none" className="p-5 sm:p-[22px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-700" />
                  <h2 className="text-[15px] font-semibold text-gray-900">Reminders</h2>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowReminderForm(!showReminderForm)}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add
                </Button>
              </div>

              {showReminderForm && (
                <div className="mb-4 p-4 rounded-[10px] border border-gray-150 bg-gray-50">
                  <ReminderForm
                    clientId={clientId}
                    onSubmit={handleCreateReminder}
                    onCancel={() => setShowReminderForm(false)}
                    isLoading={isSubmitting}
                  />
                </div>
              )}

              <div className="space-y-3">
                {reminders.length > 0 ? (
                  reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`relative p-3.5 rounded-[10px] ${
                        reminder.is_completed ? 'bg-gray-50 opacity-70' : 'bg-gray-50'
                      }`}
                    >
                      {editingReminderId === reminder.id ? (
                        <ReminderForm
                          clientId={clientId}
                          initialData={{
                            title: reminder.title,
                            description: reminder.description || '',
                            reminder_date: reminder.reminder_date,
                          }}
                          onSubmit={(data) => handleUpdateReminder(reminder.id, data)}
                          onCancel={() => setEditingReminderId(null)}
                          isLoading={isSubmitting}
                        />
                      ) : (
                        <>
                          <div className="absolute top-3 right-3 flex gap-1">
                            {!reminder.is_completed && (
                              <button
                                onClick={() => handleCompleteReminder(reminder.id)}
                                className="p-1 rounded-md text-gray-450 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                                title="Mark as complete"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setEditingReminderId(reminder.id)}
                              className="p-1 rounded-md text-gray-450 hover:text-gray-700 hover:bg-gray-200/70 transition-colors"
                              title="Edit reminder"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteReminder(reminder.id)}
                              className="p-1 rounded-md text-gray-450 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete reminder"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <h3 className="text-[13.5px] font-medium text-gray-900 pr-20">
                            {reminder.title}
                            {reminder.is_completed && (
                              <span className="ml-2 text-[11.5px] font-medium text-emerald-600">(Completed)</span>
                            )}
                          </h3>
                          {reminder.description && (
                            <p className="text-[12.5px] text-gray-500 mt-1 whitespace-pre-wrap pr-20">
                              {reminder.description}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 text-[11.5px] text-gray-450 mt-2">
                            <Clock className="w-3 h-3" />
                            <span className="font-mono">{new Date(reminder.reminder_date).toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-[13px] text-gray-450">No reminders yet</p>
                )}
              </div>
            </Surface>
          </div>

          {/* Right rail: Client Details, stretched to match the left column's full height */}
          <Surface flat padding="none" className="p-5 sm:p-[26px] flex flex-col h-full">
            <h2 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-gray-450 mb-1">
              Client Details
            </h2>
            <div className="flex-1 flex flex-col divide-y divide-gray-150">
              <DetailRow label="Type" value={detail.interestType} />
              <DetailRow label="Status" value={CLIENT_STATUS_LABEL[client.status]} />
              <DetailRow label="Area" value={detail.area || '—'} />
              <DetailRow label="Budget" value={detail.budget || '—'} />
              <DetailRow label="Last contact" value={formatLastContact(lastContactAt)} />
            </div>
          </Surface>
        </div>
      </div>
    </DashboardPage>
  );
}

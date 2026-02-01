'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ClientWithDetails, ClientNote, Reminder } from '@/types';
import ClientForm from '@/components/ClientForm';
import ReminderForm from '@/components/ReminderForm';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ArrowLeft, Edit, Trash2, Plus, Clock, CheckCircle, StickyNote, Calendar } from 'lucide-react';

/**
 * Client detail page
 * View and manage a single client with notes and reminders
 * Supports editing notes inline
 */
export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise (Next.js 16 requirement)
  const { id: clientId } = use(params);
  const router = useRouter();
  const [client, setClient] = useState<ClientWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClient();
  }, [clientId]);

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
        alert(result.error || 'Failed to update client');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Failed to update client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!confirm('Are you sure you want to delete this client? This will also delete all notes and reminders.')) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/clients');
      } else {
        alert('Failed to delete client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Failed to delete client');
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
        alert(result.error || 'Failed to add note');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
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
        alert(result.error || 'Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note');
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
        alert(result.error || 'Failed to create reminder');
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      alert('Failed to create reminder');
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
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Back button */}
      <button
        onClick={() => router.push('/dashboard/clients')}
        className="flex items-center gap-2 text-gray-600 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Clients
      </button>

      {/* Client header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{client.name}</h1>
            <div className="mt-2 space-y-1">
              {client.email && <p className="text-gray-600">{client.email}</p>}
              {client.phone && <p className="text-gray-600">{client.phone}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="md" onClick={() => setIsEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="danger" size="md" onClick={handleDeleteClient}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Edit form modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-white/10 p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Edit Client</h2>
            <ClientForm
              client={client}
              onSubmit={handleUpdateClient}
              onCancel={() => setIsEditing(false)}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notes section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <StickyNote className="w-5 h-5 text-sky-600" />
              <h2 className="text-xl font-bold text-white">Notes</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNoteForm(!showNoteForm)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </div>

          {/* Add note form */}
          {showNoteForm && (
            <div className="mb-4 p-4 bg-white/5 rounded-lg">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your note..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
              <div className="flex gap-2 mt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddNote}
                  disabled={isSubmitting || !newNote.trim()}
                >
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

          {/* Notes list */}
          <div className="space-y-3">
            {client.notes && client.notes.length > 0 ? (
              client.notes.map((note) => (
                <div key={note.id} className="p-3 bg-white/5 rounded-lg">
                  {editingNoteId === note.id ? (
                    // Edit mode
                    <div>
                      <textarea
                        value={editingNoteContent}
                        onChange={(e) => setEditingNoteContent(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateNote(note.id)}
                          disabled={isSubmitting || !editingNoteContent.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEditNote}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-gray-700 flex-1">{note.note}</p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditNote(note.id, note.note)}
                            className="text-gray-400 hover:text-sky-600"
                            title="Edit note"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-gray-400 hover:text-red-600"
                            title="Delete note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(note.created_at).toLocaleString()}
                      </p>
                    </>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No notes yet</p>
            )}
          </div>
        </Card>

        {/* Reminders section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <h2 className="text-xl font-bold text-white">Reminders</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReminderForm(!showReminderForm)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Reminder
            </Button>
          </div>

          {/* Add reminder form */}
          {showReminderForm && (
            <div className="mb-4 p-4 bg-white/5 rounded-lg">
              <ReminderForm
                clientId={clientId}
                onSubmit={handleCreateReminder}
                onCancel={() => setShowReminderForm(false)}
                isLoading={isSubmitting}
              />
            </div>
          )}

          {/* Reminders list */}
          <div className="space-y-3">
            {client.reminders && client.reminders.length > 0 ? (
              client.reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className={`p-3 rounded-lg ${
                    reminder.is_completed ? 'bg-white/5 opacity-60' : 'bg-sky-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-white text-sm">
                        {reminder.title}
                        {reminder.is_completed && (
                          <span className="ml-2 text-xs text-green-600">(Completed)</span>
                        )}
                      </h3>
                      {reminder.description && (
                        <p className="text-xs text-gray-600 mt-1">{reminder.description}</p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                        <Clock className="w-3 h-3" />
                        {new Date(reminder.reminder_date).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!reminder.is_completed && (
                        <button
                          onClick={() => handleCompleteReminder(reminder.id)}
                          className="p-1 hover:bg-green-100 rounded"
                          title="Mark as complete"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteReminder(reminder.id)}
                        className="p-1 hover:bg-red-100 rounded"
                        title="Delete reminder"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No reminders yet</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}




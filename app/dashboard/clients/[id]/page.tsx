'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ClientWithDetails, Reminder, ClientActivityType } from '@/types';
import ClientForm from '@/components/ClientForm';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Modal from '@/components/ui/Modal';
import { ClientDetailPageContentSkeleton } from '@/components/dashboard/page-loading';
import DashboardPage from '@/components/layout/DashboardPage';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  UserPlus,
  Loader2,
  PhoneCall,
  CalendarPlus,
  LayoutGrid,
  Activity,
  FileText,
  FolderOpen,
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
  buildIntakeFieldNote,
  type ClientIntakeField,
} from '@/lib/client-crm-display';
import ClientLeadOriginCard from '@/components/clients/ClientLeadOriginCard';
import ClientProfileSection from '@/components/clients/ClientProfileSection';
import ClientActivityTab from '@/components/clients/ClientActivityTab';
import ClientTransactionsTab from '@/components/clients/ClientTransactionsTab';
import ClientDocumentsTab from '@/components/clients/ClientDocumentsTab';
import LogActivityModal from '@/components/clients/LogActivityModal';

type ClientTab = 'overview' | 'activity' | 'transactions' | 'documents';

const CLIENT_TABS: { id: ClientTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'transactions', label: 'Transactions', icon: FileText },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
];

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [client, setClient] = useState<ClientWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ClientTab>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [logActivityType, setLogActivityType] = useState<ClientActivityType>('call');
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
    } catch {
      toast.error('Could not add to CRM');
    } finally {
      setAddingToCrm(false);
    }
  };

  const handleUpdateClient = async (data: { name: string; email: string; phone: string; status?: string }) => {
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
    } catch {
      toast.error('Failed to update client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveIntakeField = async (field: ClientIntakeField, value: string) => {
    setIsSubmitting(true);
    try {
      const noteResponse = await fetch(`/api/clients/${clientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: buildIntakeFieldNote(field, value) }),
      });
      const noteResult = await noteResponse.json();
      if (!noteResult.success) {
        throw new Error(noteResult.error || 'Failed to save');
      }

      if (field === 'interested_in') {
        await fetch(`/api/clients/${clientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: client?.name,
            email: client?.email ?? '',
            phone: client?.phone ?? '',
            lead_type: value,
          }),
        });
      }

      fetchClient();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogActivity = async (payload: {
    type: ClientActivityType;
    title: string;
    notes: string;
    occurred_at: string;
  }) => {
    const response = await fetch(`/api/clients/${clientId}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to log activity');
    }
    fetchClient();
    toast.success('Activity logged');
  };

  const handleDeleteClient = async () => {
    if (!confirm('Are you sure you want to delete this client? This will also delete all notes and reminders.')) {
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
      if (response.ok) {
        router.push('/dashboard/clients');
      } else {
        toast.error('Failed to delete client');
        setIsDeleting(false);
      }
    } catch {
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
    } catch {
      toast.error('Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;
    try {
      const response = await fetch(`/api/clients/${clientId}/notes/${noteId}`, { method: 'DELETE' });
      if (response.ok) fetchClient();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
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
    } catch {
      toast.error('Failed to update note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateReminder = async (data: unknown) => {
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
    } catch {
      toast.error('Failed to create reminder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateReminder = async (reminderId: string, data: unknown) => {
    setIsSubmitting(true);
    try {
      const d = data as { title: string; description?: string; reminder_date: string };
      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: d.title,
          description: d.description,
          reminder_date: d.reminder_date,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setEditingReminderId(null);
        fetchClient();
      } else {
        toast.error(result.error || 'Failed to update reminder');
      }
    } catch {
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
      if (response.ok) fetchClient();
    } catch (error) {
      console.error('Error completing reminder:', error);
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (!confirm('Delete this reminder?')) return;
    try {
      const response = await fetch(`/api/reminders/${reminderId}`, { method: 'DELETE' });
      if (response.ok) fetchClient();
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const openLogCall = () => {
    setLogActivityType('call');
    setShowLogActivity(true);
  };

  const handleSendEmail = () => {
    if (!client?.email) {
      toast.error('Add an email address first');
      setIsEditing(true);
      return;
    }
    window.location.href = `mailto:${client.email}`;
  };

  const handleScheduleFollowUp = () => {
    setActiveTab('activity');
    setShowReminderForm(true);
  };

  if (loading) {
    return (
      <DashboardPage title="Client" inline>
        <ClientDetailPageContentSkeleton />
      </DashboardPage>
    );
  }

  if (!client) return null;

  const stage = getClientStage(client);
  const stageStyle = STAGE_BADGE[stage];
  const detail = getClientDetailFields(client);
  const lastContactAt = client.notes?.[0]?.created_at || client.updated_at || client.created_at;
  const reminders: Reminder[] = client.reminders || [];
  const notes = client.notes || [];
  const activities = client.activities || [];
  const transactions = client.transactions || [];

  return (
    <DashboardPage title={client.name} subtitle={client.email || client.phone || undefined} inline>
      <div className="space-y-5">
        <button
          onClick={() => router.push(client.in_crm ? '/dashboard/clients' : '/dashboard/leads')}
          className="inline-flex items-center gap-1.5 text-[13px] text-gray-600 hover:text-gray-700 transition-colors"
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

        {/* Hero */}
        <Card className="p-5 sm:p-[26px]">
          <div className="flex flex-col gap-4">
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
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium border ${stageStyle.className}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${stageStyle.dotClassName}`} />
                      {stageStyle.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[13px] text-gray-600">
                    {client.email && (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" /> {client.email}
                      </span>
                    )}
                    {client.phone && (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" /> {client.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={openLogCall}>
                  <PhoneCall className="w-3.5 h-3.5 mr-1.5" />
                  Log call
                </Button>
                <Button variant="outline" size="sm" onClick={handleSendEmail}>
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                  Send email
                </Button>
                <Button variant="outline" size="sm" onClick={handleScheduleFollowUp}>
                  <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />
                  Schedule follow-up
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={handleDeleteClient} disabled={isDeleting}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </Button>
              </div>
            </div>

            {activeTab === 'overview' && (
              <ClientProfileSection
                detail={detail}
                statusLabel={CLIENT_STATUS_LABEL[client.status]}
                lastContact={formatLastContact(lastContactAt)}
                onSaveField={handleSaveIntakeField}
              />
            )}
          </div>
        </Card>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-[26px] overflow-x-auto">
            {CLIENT_TABS.map((tab) => {
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
                  {tab.id === 'transactions' && transactions.length > 0 && (
                    <span className="ml-0.5 text-[11px] text-gray-500">({transactions.length})</span>
                  )}
                  {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-500" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab panels */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {client.lead_origin && (
              <ClientLeadOriginCard
                leadOrigin={client.lead_origin}
                clientId={client.id}
                inCrm={Boolean(client.in_crm)}
              />
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <ClientActivityTab
            clientId={clientId}
            notes={notes}
            reminders={reminders}
            activities={activities}
            showNoteForm={showNoteForm}
            showReminderForm={showReminderForm}
            newNote={newNote}
            editingNoteId={editingNoteId}
            editingNoteContent={editingNoteContent}
            editingReminderId={editingReminderId}
            isSubmitting={isSubmitting}
            onToggleNoteForm={() => setShowNoteForm((v) => !v)}
            onToggleReminderForm={() => setShowReminderForm((v) => !v)}
            onNewNoteChange={setNewNote}
            onAddNote={handleAddNote}
            onCancelNoteForm={() => { setShowNoteForm(false); setNewNote(''); }}
            onEditNote={(id, content) => { setEditingNoteId(id); setEditingNoteContent(content); }}
            onUpdateNote={handleUpdateNote}
            onCancelEditNote={() => { setEditingNoteId(null); setEditingNoteContent(''); }}
            onDeleteNote={handleDeleteNote}
            onEditingNoteContentChange={setEditingNoteContent}
            onCreateReminder={handleCreateReminder}
            onUpdateReminder={handleUpdateReminder}
            onCompleteReminder={handleCompleteReminder}
            onDeleteReminder={handleDeleteReminder}
            onEditReminder={setEditingReminderId}
            onCancelEditReminder={() => setEditingReminderId(null)}
          />
        )}

        {activeTab === 'transactions' && (
          <ClientTransactionsTab transactions={transactions} clientId={clientId} />
        )}

        {activeTab === 'documents' && <ClientDocumentsTab />}
      </div>

      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Client" size="md">
        <ClientForm
          client={client}
          onSubmit={handleUpdateClient}
          onCancel={() => setIsEditing(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      <LogActivityModal
        isOpen={showLogActivity}
        onClose={() => setShowLogActivity(false)}
        defaultType={logActivityType}
        onSubmit={handleLogActivity}
      />
    </DashboardPage>
  );
}

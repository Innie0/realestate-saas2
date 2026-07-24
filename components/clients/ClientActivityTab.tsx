'use client';

import { useMemo } from 'react';
import {
  Phone,
  Mail,
  Home,
  FileText,
  Calendar,
  Clock,
  Pencil,
  Trash2,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import ReminderForm from '@/components/ReminderForm';
import { ClientActivity, ClientNote, Reminder } from '@/types';

type FeedItem =
  | { kind: 'activity'; id: string; date: string; activity: ClientActivity }
  | { kind: 'note'; id: string; date: string; note: ClientNote }
  | { kind: 'reminder'; id: string; date: string; reminder: Reminder };

const ACTIVITY_ICONS = {
  call: Phone,
  email: Mail,
  showing: Home,
} as const;

interface ClientActivityTabProps {
  clientId: string;
  notes: ClientNote[];
  reminders: Reminder[];
  activities: ClientActivity[];
  showNoteForm: boolean;
  showReminderForm: boolean;
  newNote: string;
  editingNoteId: string | null;
  editingNoteContent: string;
  editingReminderId: string | null;
  isSubmitting: boolean;
  onToggleNoteForm: () => void;
  onToggleReminderForm: () => void;
  onNewNoteChange: (value: string) => void;
  onAddNote: () => void;
  onCancelNoteForm: () => void;
  onEditNote: (noteId: string, content: string) => void;
  onUpdateNote: (noteId: string) => void;
  onCancelEditNote: () => void;
  onDeleteNote: (noteId: string) => void;
  onEditingNoteContentChange: (value: string) => void;
  onCreateReminder: (data: unknown) => Promise<void>;
  onUpdateReminder: (reminderId: string, data: unknown) => Promise<void>;
  onCompleteReminder: (reminderId: string) => void;
  onDeleteReminder: (reminderId: string) => void;
  onEditReminder: (reminderId: string) => void;
  onCancelEditReminder: () => void;
}

export default function ClientActivityTab(props: ClientActivityTabProps) {
  const feed = useMemo(() => {
    const items: FeedItem[] = [
      ...props.activities.map((activity) => ({
        kind: 'activity' as const,
        id: `activity-${activity.id}`,
        date: activity.occurred_at,
        activity,
      })),
      ...props.notes.map((note) => ({
        kind: 'note' as const,
        id: `note-${note.id}`,
        date: note.created_at,
        note,
      })),
      ...props.reminders.map((reminder) => ({
        kind: 'reminder' as const,
        id: `reminder-${reminder.id}`,
        date: reminder.reminder_date,
        reminder,
      })),
    ];
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [props.activities, props.notes, props.reminders]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={props.onToggleNoteForm}>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add note
        </Button>
        <Button variant="outline" size="sm" onClick={props.onToggleReminderForm}>
          <Calendar className="w-3.5 h-3.5 mr-1.5" />
          Add reminder
        </Button>
      </div>

      {props.showNoteForm && (
        <Card className="p-4 bg-gray-50 border-gray-150">
          <textarea
            value={props.newNote}
            onChange={(e) => props.onNewNoteChange(e.target.value)}
            placeholder="Enter your note…"
            rows={3}
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-[var(--surface)] text-[13px] text-gray-900 focus:ring-2 focus:ring-brand-500/30 focus:outline-none resize-none"
          />
          <div className="flex gap-2 mt-3">
            <Button variant="primary" size="sm" onClick={props.onAddNote} disabled={props.isSubmitting || !props.newNote.trim()}>
              Save note
            </Button>
            <Button variant="outline" size="sm" onClick={props.onCancelNoteForm}>Cancel</Button>
          </div>
        </Card>
      )}

      {props.showReminderForm && (
        <Card className="p-4 bg-gray-50 border-gray-150">
          <ReminderForm
            clientId={props.clientId}
            onSubmit={props.onCreateReminder}
            onCancel={props.onToggleReminderForm}
            isLoading={props.isSubmitting}
          />
        </Card>
      )}

      {feed.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-[13px] text-gray-600">No activity yet — log a call or add a note to get started.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {feed.map((item) => {
            if (item.kind === 'activity') {
              const Icon = ACTIVITY_ICONS[item.activity.type] ?? FileText;
              return (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        {item.activity.type}
                      </p>
                      <p className="text-[14px] font-semibold text-gray-900 mt-0.5">{item.activity.title}</p>
                      {item.activity.notes && (
                        <p className="text-[13px] text-gray-700 mt-1 whitespace-pre-wrap">{item.activity.notes}</p>
                      )}
                      <p className="text-[11.5px] text-gray-600 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.date).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            }

            if (item.kind === 'note') {
              const note = item.note;
              return (
                <Card key={item.id} className="p-4 relative">
                  {props.editingNoteId === note.id ? (
                    <div>
                      <textarea
                        value={props.editingNoteContent}
                        onChange={(e) => props.onEditingNoteContentChange(e.target.value)}
                        rows={3}
                        autoFocus
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-[var(--surface)] text-[13px] focus:ring-2 focus:ring-brand-500/30 focus:outline-none resize-none"
                      />
                      <div className="flex gap-2 mt-3">
                        <Button variant="primary" size="sm" onClick={() => props.onUpdateNote(note.id)} disabled={props.isSubmitting}>
                          Save
                        </Button>
                        <Button variant="outline" size="sm" onClick={props.onCancelEditNote}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="absolute top-3 right-3 flex gap-1">
                        <button type="button" onClick={() => props.onEditNote(note.id, note.note)} className="p-1 rounded-md text-gray-600 hover:bg-gray-100">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => props.onDeleteNote(note.id)} className="p-1 rounded-md text-gray-600 hover:text-rose-600 hover:bg-rose-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-1">Note</p>
                      <p className="text-[13.5px] text-gray-700 whitespace-pre-wrap pr-14">{note.note}</p>
                      <p className="text-[11.5px] text-gray-600 mt-2">{new Date(note.created_at).toLocaleString()}</p>
                    </>
                  )}
                </Card>
              );
            }

            const reminder = item.reminder;
            return (
              <Card key={item.id} className={`p-4 relative ${reminder.is_completed ? 'opacity-70' : ''}`}>
                {props.editingReminderId === reminder.id ? (
                  <ReminderForm
                    clientId={props.clientId}
                    initialData={{
                      title: reminder.title,
                      description: reminder.description || '',
                      reminder_date: reminder.reminder_date,
                    }}
                    onSubmit={(data) => props.onUpdateReminder(reminder.id, data)}
                    onCancel={props.onCancelEditReminder}
                    isLoading={props.isSubmitting}
                  />
                ) : (
                  <>
                    <div className="absolute top-3 right-3 flex gap-1">
                      {!reminder.is_completed && (
                        <button type="button" onClick={() => props.onCompleteReminder(reminder.id)} className="p-1 rounded-md text-gray-600 hover:text-teal-700 hover:bg-teal-50">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button type="button" onClick={() => props.onEditReminder(reminder.id)} className="p-1 rounded-md text-gray-600 hover:bg-gray-100">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => props.onDeleteReminder(reminder.id)} className="p-1 rounded-md text-gray-600 hover:text-rose-600 hover:bg-rose-50">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 mb-1">Reminder</p>
                    <p className="text-[14px] font-semibold text-gray-900 pr-16">{reminder.title}</p>
                    {reminder.description && (
                      <p className="text-[13px] text-gray-700 mt-1 pr-16">{reminder.description}</p>
                    )}
                    <p className="text-[11.5px] text-gray-600 mt-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(reminder.reminder_date).toLocaleString()}
                      {reminder.is_completed && <span className="text-emerald-600 ml-2">Completed</span>}
                    </p>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

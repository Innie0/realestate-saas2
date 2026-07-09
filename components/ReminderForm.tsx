'use client';

import { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';

interface ReminderFormInitial {
  title: string;
  description?: string;
  reminder_date: string;
}

interface ReminderFormProps {
  clientId: string;
  /** Pass an existing reminder to render the form in edit mode. */
  initialData?: ReminderFormInitial;
  onSubmit: (data: {
    client_id: string;
    title: string;
    description: string;
    reminder_date: string;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/** Converts an ISO date string into the local `datetime-local` input format. */
function toDateTimeLocal(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * ReminderForm component
 * Form for creating or editing a reminder
 */
export default function ReminderForm({ clientId, initialData, onSubmit, onCancel, isLoading }: ReminderFormProps) {
  const isEditing = Boolean(initialData);
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    reminder_date: initialData ? toDateTimeLocal(initialData.reminder_date) : '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      client_id: clientId,
      ...formData,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title field */}
      <div>
        <label htmlFor="title" className="block text-[13px] font-medium text-gray-600 mb-1">
          Title *
        </label>
        <Input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Follow-up call"
          required
        />
      </div>

      {/* Description field */}
      <div>
        <label htmlFor="description" className="block text-[13px] font-medium text-gray-600 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Additional notes..."
          rows={3}
          className="w-full px-3 py-2 rounded-[10px] border border-gray-200 bg-white text-[13px] text-gray-900 placeholder-gray-450 focus:ring-2 focus:ring-brand-500/30 focus:outline-none resize-none"
        />
      </div>

      {/* Reminder date field */}
      <div>
        <label htmlFor="reminder_date" className="block text-[13px] font-medium text-gray-600 mb-1">
          Reminder Date & Time *
        </label>
        <Input
          id="reminder_date"
          type="datetime-local"
          value={formData.reminder_date}
          onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
          required
        />
      </div>

      {/* Form actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Reminder'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

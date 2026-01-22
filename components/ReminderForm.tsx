'use client';

import { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';

interface ReminderFormProps {
  clientId: string;
  onSubmit: (data: {
    client_id: string;
    title: string;
    description: string;
    reminder_date: string;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * ReminderForm component
 * Form for creating a new reminder
 */
export default function ReminderForm({ clientId, onSubmit, onCancel, isLoading }: ReminderFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminder_date: '',
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
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
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
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Additional notes..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        />
      </div>

      {/* Reminder date field */}
      <div>
        <label htmlFor="reminder_date" className="block text-sm font-medium text-gray-700 mb-1">
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
          {isLoading ? 'Creating...' : 'Create Reminder'}
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












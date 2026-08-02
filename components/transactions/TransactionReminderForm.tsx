'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export type TransactionReminderFormData = {
  title: string;
  description: string;
  reminder_date: string;
};

type TransactionReminderFormProps = {
  onSubmit: (data: TransactionReminderFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
};

export default function TransactionReminderForm({
  onSubmit,
  onCancel,
  isLoading,
}: TransactionReminderFormProps) {
  const [formData, setFormData] = useState<TransactionReminderFormData>({
    title: '',
    description: '',
    reminder_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="transaction-reminder-title" className="mb-1 block text-[13px] font-medium text-gray-600">
          Title *
        </label>
        <Input
          id="transaction-reminder-title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Follow up on inspection"
          required
        />
      </div>

      <div>
        <label htmlFor="transaction-reminder-description" className="mb-1 block text-[13px] font-medium text-gray-600">
          Description
        </label>
        <textarea
          id="transaction-reminder-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Additional notes..."
          rows={3}
          className="w-full resize-none rounded-[10px] border border-gray-200 bg-[var(--surface)] px-3 py-2 text-[13px] text-gray-900 placeholder-gray-450 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      <div>
        <label htmlFor="transaction-reminder-date" className="mb-1 block text-[13px] font-medium text-gray-600">
          Reminder date & time *
        </label>
        <Input
          id="transaction-reminder-date"
          type="datetime-local"
          value={formData.reminder_date}
          onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
          required
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" variant="primary" size="md" disabled={isLoading} isLoading={isLoading}>
          Create reminder
        </Button>
        <Button type="button" variant="outline" size="md" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

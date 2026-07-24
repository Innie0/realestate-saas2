'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { ClientActivityType } from '@/types';

interface LogActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ClientActivityType;
  onSubmit: (payload: {
    type: ClientActivityType;
    title: string;
    notes: string;
    occurred_at: string;
  }) => Promise<void>;
}

const TYPE_OPTIONS = [
  { value: 'call', label: 'Phone call' },
  { value: 'email', label: 'Email' },
  { value: 'showing', label: 'Showing' },
];

export default function LogActivityModal({
  isOpen,
  onClose,
  defaultType = 'call',
  onSubmit,
}: LogActivityModalProps) {
  const [type, setType] = useState<ClientActivityType>(defaultType);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [occurredAt, setOccurredAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        type,
        title: title.trim(),
        notes: notes.trim(),
        occurred_at: new Date(occurredAt).toISOString(),
      });
      setTitle('');
      setNotes('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log activity"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Type"
          value={type}
          onChange={(value) => setType(value as ClientActivityType)}
          triggerClassName="w-full px-3 py-2 bg-[var(--surface)] border border-gray-200 rounded-lg"
          options={TYPE_OPTIONS}
        />
        <Input
          label="Summary *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Discussed pre-approval, scheduled showing…"
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">When</label>
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional details…"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving || !title.trim()}>
            {saving ? 'Saving…' : 'Log activity'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

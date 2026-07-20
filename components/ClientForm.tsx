'use client';

import { useState } from 'react';
import { Client } from '@/types';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { CLIENT_STATUS_LABEL } from '@/lib/client-crm-display';

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: { name: string; email: string; phone: string; status?: string }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Format phone number as (###) ###-####
 * @param value - Raw phone number input
 * @returns Formatted phone number
 */
const formatPhoneNumber = (value: string) => {
  // Remove all non-digits
  const phoneNumber = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const truncated = phoneNumber.slice(0, 10);
  
  // Format as (###) ###-####
  if (truncated.length === 0) {
    return '';
  } else if (truncated.length <= 3) {
    return truncated;
  } else if (truncated.length <= 6) {
    return `(${truncated.slice(0, 3)}) ${truncated.slice(3)}`;
  } else {
    return `(${truncated.slice(0, 3)}) ${truncated.slice(3, 6)}-${truncated.slice(6)}`;
  }
};

/**
 * ClientForm component
 * Form for creating or editing a client
 */
export default function ClientForm({ client, onSubmit, onCancel, isLoading }: ClientFormProps) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    status: client?.status || 'active',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name *"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Enter client name"
        required
      />

      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="client@example.com"
      />

      <Input
        label="Phone"
        type="tel"
        value={formData.phone}
        onChange={handlePhoneChange}
        placeholder="(555) 123-4567"
      />

      {/* Status field (only for editing) */}
      {client && (
        <Select
          id="status"
          label="Status"
          value={formData.status}
          onChange={(status) =>
            setFormData({ ...formData, status: status as 'active' | 'inactive' | 'archived' })
          }
          triggerClassName="w-full px-3 py-2 bg-[var(--surface)] border border-gray-200 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          options={[
            { value: 'active', label: CLIENT_STATUS_LABEL.active },
            { value: 'inactive', label: CLIENT_STATUS_LABEL.inactive },
            { value: 'archived', label: CLIENT_STATUS_LABEL.archived },
          ]}
        />
      )}

      {/* Form actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-150">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
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

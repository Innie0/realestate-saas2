'use client';

import { useState } from 'react';
import { Client } from '@/types';
import Button from './ui/Button';
import Input from './ui/Input';

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
      {/* Name field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter client name"
          required
        />
      </div>

      {/* Email field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="client@example.com"
        />
      </div>

      {/* Phone field */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone
        </label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={handlePhoneChange}
          placeholder="(555) 123-4567"
        />
      </div>

      {/* Status field (only for editing) */}
      {client && (
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'archived' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      )}

      {/* Form actions */}
      <div className="flex gap-3 pt-4">
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



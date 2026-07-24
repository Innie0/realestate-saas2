'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import {
  ClientDetailFields,
  ClientIntakeField,
  buildIntakeFieldNote,
} from '@/lib/client-crm-display';

const INTEREST_OPTIONS = [
  { value: 'buyer', label: 'Buying' },
  { value: 'seller', label: 'Selling' },
  { value: 'renter', label: 'Renting' },
  { value: 'browsing', label: 'Just looking' },
];

interface ProfileFieldProps {
  label: string;
  value: string | null;
  field: ClientIntakeField;
  onSave: (field: ClientIntakeField, value: string) => Promise<void>;
  inputType?: 'text' | 'select';
  selectOptions?: { value: string; label: string }[];
}

function ProfileField({
  label,
  value,
  field,
  onSave,
  inputType = 'text',
  selectOptions,
}: ProfileFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraft(value ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await onSave(field, draft.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="text-[11px] text-gray-600">{label}</p>
      {editing ? (
        <div className="mt-1.5 space-y-2">
          {inputType === 'select' && selectOptions ? (
            <Select
              value={draft}
              onChange={setDraft}
              triggerClassName="w-full px-3 py-2 bg-[var(--surface)] border border-gray-200 text-gray-900 rounded-lg text-[13px]"
              options={selectOptions}
            />
          ) : (
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Enter ${label.toLowerCase()}`}
              className="text-[13px]"
            />
          )}
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !draft.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      ) : value ? (
        <button
          type="button"
          onClick={startEdit}
          className="mt-1 text-left text-[14px] font-semibold text-gray-900 hover:text-brand-700"
        >
          {value}
        </button>
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="mt-1 inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700"
        >
          <Plus className="w-3.5 h-3.5" />
          Add {label.toLowerCase()}
        </button>
      )}
    </div>
  );
}

interface ClientProfileSectionProps {
  detail: ClientDetailFields;
  statusLabel: string;
  lastContact: string;
  onSaveField: (field: ClientIntakeField, value: string) => Promise<void>;
}

export default function ClientProfileSection({
  detail,
  statusLabel,
  lastContact,
  onSaveField,
}: ClientProfileSectionProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5 pt-5 border-t border-gray-150">
      <ProfileField
        label="Interested in"
        value={detail.interestType}
        field="interested_in"
        onSave={onSaveField}
        inputType="select"
        selectOptions={INTEREST_OPTIONS}
      />
      <ProfileField label="Budget" value={detail.budget} field="budget" onSave={onSaveField} />
      <ProfileField label="Area" value={detail.area} field="area" onSave={onSaveField} />
      <ProfileField label="Timeline" value={detail.timeline} field="timeline" onSave={onSaveField} />
      <div>
        <p className="text-[11px] text-gray-600">Status</p>
        <p className="mt-1 text-[14px] font-semibold text-gray-900">{statusLabel}</p>
      </div>
      <div>
        <p className="text-[11px] text-gray-600">Last contact</p>
        <p className="mt-1 text-[14px] font-semibold text-gray-900">{lastContact}</p>
      </div>
    </div>
  );
}

export { buildIntakeFieldNote };

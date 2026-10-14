'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AccountOption {
  customerId: string;
  label: string;
  isTestAccount: boolean;
}

interface GoogleAccountPickerProps {
  /** Called after the agent switches accounts */
  onChanged: (message: { type: 'success' | 'error'; text: string }) => void;
}

/** Lets an agent with several Google Ads accounts choose which one new ads use. */
export default function GoogleAccountPicker({ onChanged }: GoogleAccountPickerProps) {
  const [accounts, setAccounts] = useState<AccountOption[] | null>(null);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ads/google/accounts');
      const json = await res.json().catch(() => null);
      if (!json?.success) throw new Error(json?.error || 'Could not load your accounts.');
      setAccounts(json.data.accounts);
      setSelected(json.data.selectedCustomerId ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your accounts.');
    } finally {
      setLoading(false);
    }
  };

  const chooseAccount = async (customerId: string) => {
    const previous = selected;
    setSelected(customerId);
    setSaving(true);
    try {
      const res = await fetch('/api/ads/google/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });
      const json = await res.json().catch(() => null);
      if (!json?.success) {
        setSelected(previous);
        onChanged({ type: 'error', text: json?.error || 'Could not switch accounts.' });
        return;
      }
      onChanged({ type: 'success', text: json.message || 'Google Ads account updated.' });
    } catch {
      setSelected(previous);
      onChanged({ type: 'error', text: 'Could not switch accounts. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (accounts === null) {
    return (
      <div className="mt-2">
        <button
          type="button"
          onClick={() => void loadAccounts()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-3 w-3 animate-spin" />}
          Use a different account
        </button>
        {error && <p className="mt-1 text-[12px] text-rose-600">{error}</p>}
      </div>
    );
  }

  if (accounts.length <= 1) {
    return (
      <p className="mt-2 text-[12px] text-gray-600">
        This is the only Google Ads account on this login.
      </p>
    );
  }

  return (
    <div className="mt-2">
      <label className="block text-[12px] text-gray-600 mb-1">Publish new ads from</label>
      <select
        value={selected}
        onChange={(e) => void chooseAccount(e.target.value)}
        disabled={saving}
        className="w-full rounded-lg border border-gray-200 bg-[var(--surface)] px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60"
      >
        {accounts.map((account) => (
          <option key={account.customerId} value={account.customerId}>
            {account.label}
          </option>
        ))}
      </select>
      <p className="mt-1 text-[11.5px] text-gray-600">
        Ads that are already running stay on the account they were created in.
      </p>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import type { ScoredComp, SubjectProperty } from '@/lib/cma';

export interface CmaAddCompFormProps {
  subjectAddress: string;
  subject: SubjectProperty;
  activeListingAddresses?: string[];
  disabled?: boolean;
  onCompAdded: (comp: ScoredComp) => void;
}

export default function CmaAddCompForm({
  subjectAddress,
  subject,
  activeListingAddresses = [],
  disabled,
  onCompAdded,
}: CmaAddCompFormProps) {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/market-analysis/lookup-comp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compAddress: address.trim(),
          subjectAddress,
          subject,
          activeListingAddresses,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Could not add that comp.');
        return;
      }
      onCompAdded(data.data.comp as ScoredComp);
      setAddress('');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[10px] border border-dashed border-gray-250 bg-gray-50/80 p-3.5"
    >
      <p className="mb-2 text-[12.5px] font-medium text-gray-800">Add comp by address</p>
      <p className="mb-2.5 text-[11.5px] text-gray-600">
        Know a closed sale that should count? Paste the full address to pull it from listing records.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Oak St, Phoenix, AZ 85001"
          disabled={disabled || loading}
          className="flex-1 rounded-[10px] border border-gray-200 bg-[var(--surface)] px-3 py-2 text-[13px] text-gray-900 placeholder:text-gray-450 focus:border-gray-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={disabled || loading || !address.trim()}
          className="inline-flex items-center justify-center gap-1.5 rounded-[10px] bg-brand-500 px-4 py-2 text-[13px] font-semibold text-[var(--brand-foreground)] hover:bg-brand-600 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add comp
        </button>
      </div>
      {error && <p className="mt-2 text-[12px] text-rose-600">{error}</p>}
    </form>
  );
}

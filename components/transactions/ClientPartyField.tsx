'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { Link2, Loader2, UserPlus, X } from 'lucide-react';
import Input from '@/components/ui/Input';
import { LinkedClientSummary } from '@/types';

export interface ClientSearchResult {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface ClientPartyFieldProps {
  role: 'buyer' | 'seller';
  name: string;
  email: string;
  phone: string;
  linkedClientId: string | null;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onLinkClient: (client: ClientSearchResult) => void;
  onUnlinkClient: () => void;
}

export default function ClientPartyField({
  role,
  name,
  email,
  phone,
  linkedClientId,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onLinkClient,
  onUnlinkClient,
}: ClientPartyFieldProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [matches, setMatches] = useState<ClientSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState('');

  const roleLabel = role === 'buyer' ? 'Buyer' : 'Seller';
  const searchTerm = [name.trim(), email.trim()].filter(Boolean).join(' ');

  const runSearch = useCallback(async (query: string) => {
    if (linkedClientId || query.length < 2) {
      setMatches([]);
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const response = await fetch(`/api/clients/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      setMatches(data.data ?? []);
    } catch (err: unknown) {
      setSearchError(err instanceof Error ? err.message : 'Search failed');
      setMatches([]);
    } finally {
      setIsSearching(false);
    }
  }, [linkedClientId]);

  useEffect(() => {
    if (!showSuggestions || linkedClientId) return;

    const timer = window.setTimeout(() => {
      runSearch(searchTerm);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchTerm, showSuggestions, linkedClientId, runSearch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateClient = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsCreating(true);
    setSearchError('');

    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: email.trim() || null,
          phone: phone.trim() || null,
        }),
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to create client');
      }

      onLinkClient(data.data as LinkedClientSummary);
      setShowSuggestions(false);
      setMatches([]);
    } catch (err: unknown) {
      setSearchError(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setIsCreating(false);
    }
  };

  const exactMatch = matches.find(
    (match) => match.name.toLowerCase() === name.trim().toLowerCase(),
  );

  const canCreate =
    name.trim().length > 0 && !linkedClientId && !exactMatch && !isCreating;

  return (
    <div ref={containerRef} className="space-y-4">
      <div className="relative">
        <Input
          label={`${roleLabel} Name *`}
          value={name}
          onChange={(e) => {
            if (linkedClientId) onUnlinkClient();
            onNameChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="John Smith"
          required
          autoComplete="off"
          aria-expanded={showSuggestions && !linkedClientId}
          aria-controls={listboxId}
        />

        {linkedClientId && (
          <div className="mt-2 flex items-center gap-2 text-[12.5px]">
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-100 px-2.5 py-0.5 text-teal-800">
              <Link2 className="w-3 h-3" />
              Linked to CRM
            </span>
            <Link
              href={`/dashboard/clients/${linkedClientId}`}
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              View client
            </Link>
            <button
              type="button"
              onClick={onUnlinkClient}
              className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-3 h-3" />
              Unlink
            </button>
          </div>
        )}

        {showSuggestions && !linkedClientId && (searchTerm.length >= 2 || matches.length > 0) && (
          <div
            id={listboxId}
            role="listbox"
            className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-[var(--surface)] shadow-lg overflow-hidden"
          >
            {isSearching && (
              <div className="flex items-center gap-2 px-3 py-2.5 text-[13px] text-gray-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Searching clients…
              </div>
            )}

            {!isSearching && matches.length > 0 && (
              <ul className="py-1">
                {matches.map((match) => (
                  <li key={match.id}>
                    <button
                      type="button"
                      role="option"
                      className="w-full px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        onLinkClient(match);
                        setShowSuggestions(false);
                        setMatches([]);
                      }}
                    >
                      <p className="text-[13px] font-medium text-gray-900">{match.name}</p>
                      {(match.email || match.phone) && (
                        <p className="text-[12px] text-gray-600 mt-0.5">
                          {[match.email, match.phone].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!isSearching && canCreate && (
              <button
                type="button"
                className={clsx(
                  'w-full flex items-center gap-2 px-3 py-2.5 text-left text-[13px] font-medium',
                  'text-brand-700 hover:bg-brand-50 border-t border-gray-100',
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleCreateClient}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Creating client…
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    Create client &ldquo;{name.trim()}&rdquo;
                  </>
                )}
              </button>
            )}

            {!isSearching && matches.length === 0 && searchTerm.length >= 2 && !canCreate && (
              <p className="px-3 py-2.5 text-[13px] text-gray-600">No matching clients found.</p>
            )}
          </div>
        )}
      </div>

      {searchError && (
        <p className="text-[12.5px] text-rose-600">{searchError}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={`${roleLabel} Email`}
          type="email"
          value={email}
          onChange={(e) => {
            if (linkedClientId) onUnlinkClient();
            onEmailChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={`${role}@email.com`}
        />
        <Input
          label={`${roleLabel} Phone`}
          value={phone}
          onChange={(e) => {
            if (linkedClientId) onUnlinkClient();
            onPhoneChange(e.target.value);
          }}
          placeholder="(555) 123-4567"
        />
      </div>
    </div>
  );
}

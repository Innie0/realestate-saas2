'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { BarChart2, Home, MapPin } from 'lucide-react';
import { parseAddressQuery } from '@/lib/search/parse-address';
import Select from '@/components/ui/Select';

export type ResearchSearchMode = 'research' | 'cma';

export interface ResearchHistoryEntry {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  lookedUpAt: string;
}

export interface UsageQuota {
  current: number;
  limit: number;
}

const MODES: { id: ResearchSearchMode; label: string; icon: typeof Home }[] = [
  { id: 'research', label: 'Subject property', icon: Home },
  { id: 'cma', label: 'Run CMA', icon: BarChart2 },
];

function remainingCredits(usage: UsageQuota | null | undefined): string | null {
  if (!usage) return null;
  if (usage.limit === -1) return '∞';
  return String(Math.max(0, usage.limit - usage.current));
}

function fieldInputClass(extra = '') {
  return clsx(
    'w-full rounded-lg border border-border bg-card px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
    extra,
  );
}

export interface PropertyResearchCommandBarProps {
  mode: ResearchSearchMode;
  onModeChange: (mode: ResearchSearchMode) => void;
  onSubmit: (
    fields: { street: string; city: string; state: string; zip: string },
    mode: ResearchSearchMode,
  ) => void;
  history: ResearchHistoryEntry[];
  onHistorySelect: (entry: ResearchHistoryEntry) => void;
  states: { value: string; label: string }[];
  lookupUsage?: UsageQuota | null;
  cmaUsage?: UsageQuota | null;
  loading?: boolean;
  onTryDemo?: () => void;
}

export default function PropertyResearchCommandBar({
  mode,
  onModeChange,
  onSubmit,
  history,
  onHistorySelect,
  states,
  lookupUsage = null,
  cmaUsage = null,
  loading = false,
  onTryDemo,
}: PropertyResearchCommandBarProps) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [showFields, setShowFields] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('oikaro_research_search_mode');
      if (saved === 'research' || saved === 'cma') onModeChange(saved);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate mode once
  }, []);

  const persistMode = (next: ResearchSearchMode) => {
    onModeChange(next);
    try {
      localStorage.setItem('oikaro_research_search_mode', next);
    } catch {
      /* ignore */
    }
  };

  const submitFields = (fields: { street: string; city: string; state: string; zip: string }) => {
    if (!fields.street.trim()) {
      setError('Enter a street address.');
      return;
    }
    if (!fields.state) {
      setError('Include state in the address (e.g. Visalia, CA 93291) or pick a state below.');
      setShowFields(true);
      return;
    }
    setError('');
    onSubmit(
      {
        street: fields.street.trim(),
        city: fields.city.trim(),
        state: fields.state,
        zip: fields.zip.trim(),
      },
      mode,
    );
  };

  const handleSubmit = () => {
    const parsed = parseAddressQuery(query);
    if (parsed?.state) {
      submitFields(parsed);
      return;
    }

    if (showFields || street.trim()) {
      submitFields({ street: street || query, city, state, zip });
      return;
    }

    if (parsed && !parsed.state) {
      setStreet(parsed.street);
      setCity(parsed.city);
      setZip(parsed.zip);
      setShowFields(true);
      setError('Select a state to continue.');
      return;
    }

    if (query.trim()) {
      setStreet(query.trim());
      setShowFields(true);
      setError('Add city and state, or paste a full address.');
      return;
    }

    setError('Search for a property address.');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey && !loading) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const activeUsage = mode === 'cma' ? cmaUsage : lookupUsage;
  const creditsLeft = remainingCredits(activeUsage);
  const creditsTitle =
    mode === 'cma'
      ? cmaUsage
        ? cmaUsage.limit === -1
          ? 'Unlimited CMA runs'
          : `${Math.max(0, cmaUsage.limit - cmaUsage.current)} CMA runs left this month`
        : 'CMA usage'
      : lookupUsage
        ? lookupUsage.limit === -1
          ? 'Unlimited lookups'
          : `${Math.max(0, lookupUsage.limit - lookupUsage.current)} lookups left this month`
        : 'Lookup usage';

  return (
    <div
      className="flex min-h-[calc(100vh-11rem)] flex-col items-center justify-center px-4 py-8"
      data-tour="research-search"
    >
      <h2 className="text-center text-[26px] font-normal tracking-tight text-foreground sm:text-[32px]">
        Find subject property
      </h2>

      <div className="mt-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Input panel — Breezy-style tall search area */}
        <div className="relative min-h-[140px] border-b border-border bg-[var(--canvas)] px-4 pb-12 pt-4 sm:min-h-[152px] sm:px-5 sm:pt-5">
          <textarea
            rows={3}
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'cma'
                ? 'Search to run a CMA…'
                : 'Search for a property address…'
            }
            disabled={loading}
            className="size-full min-h-[72px] resize-none border-0 bg-transparent p-0 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 disabled:opacity-60"
          />

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--canvas)]/80">
              <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          )}

          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4">
            {creditsLeft !== null ? (
              <div
                className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-[13px] font-semibold tabular-nums text-foreground shadow-sm"
                title={creditsTitle}
              >
                {creditsLeft}
              </div>
            ) : null}
          </div>
        </div>

        {/* Mode + history panel */}
        <div className="bg-card p-3 sm:p-4">
          <div className="flex flex-wrap gap-2">
            {MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => persistMode(id)}
                className={clsx(
                  'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] font-medium transition-colors',
                  mode === id
                    ? 'border-gray-900/10 bg-gray-900 text-white shadow-sm'
                    : 'border-transparent bg-muted/50 text-gray-700 hover:bg-muted',
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={1.75} />
                {label}
              </button>
            ))}
          </div>

          {showFields && (
            <div className="mt-3 space-y-2 rounded-xl border border-dashed border-border bg-[var(--canvas)] p-3">
              <p className="text-[11px] font-medium text-muted-foreground">Complete the address</p>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Street address"
                className={fieldInputClass()}
              />
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className={fieldInputClass()}
                />
                <Select
                  value={state}
                  onChange={setState}
                  placeholder="State"
                  triggerClassName={fieldInputClass(!state ? '!text-gray-400' : '')}
                  options={[
                    { value: '', label: 'State' },
                    ...states.map((s) => ({ value: s.value, label: s.label })),
                  ]}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={zip}
                  onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="ZIP"
                  className={fieldInputClass()}
                />
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="mt-1 w-full rounded-lg bg-brand-500 py-2 text-[13px] font-semibold text-[var(--brand-foreground)] hover:bg-brand-600 disabled:opacity-50"
              >
                {mode === 'cma' ? 'Run CMA' : 'Research property'}
              </button>
            </div>
          )}

          {error && <p className="mt-3 text-[12.5px] text-rose-600">{error}</p>}

          {onTryDemo && (
            <p className="mt-3 text-[11.5px] text-muted-foreground">
              Demo:{' '}
              <button
                type="button"
                onClick={() => {
                  setQuery('123 W Main Street, Austin, TX 78701');
                  setShowFields(false);
                  setError('');
                  onTryDemo();
                }}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                123 W Main Street, Austin, TX
              </button>
            </p>
          )}

          <div className="mt-3">
            <p className="mb-1.5 text-[12px] text-muted-foreground">Recent searches</p>
            {history.length === 0 ? (
              <p className="px-1 py-2 text-[12.5px] text-muted-foreground/80">
                Your recent addresses will appear here.
              </p>
            ) : (
              <ul className="max-h-44 space-y-0.5 overflow-y-auto">
                {history.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => onHistorySelect(entry)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-muted/60"
                    >
                      <MapPin className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                      <span className="min-w-0 break-words text-[13.5px] text-foreground">
                        {entry.label}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

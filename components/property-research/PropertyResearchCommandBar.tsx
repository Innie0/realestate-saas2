'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { BarChart2, Home, MapPin, Search, Sparkles } from 'lucide-react';
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

const inputClass =
  'w-full rounded-xl border border-border bg-[var(--canvas)] px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20';

const MODES: { id: ResearchSearchMode; label: string; icon: typeof Home; hint: string }[] = [
  {
    id: 'research',
    label: 'Property research',
    icon: Home,
    hint: 'Owner contact, property details, and overview',
  },
  {
    id: 'cma',
    label: 'Run CMA',
    icon: BarChart2,
    hint: 'Jump straight to comp-based market analysis',
  },
];

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
    if (event.key === 'Enter' && !loading) handleSubmit();
  };

  const activeMode = MODES.find((m) => m.id === mode)!;

  return (
    <div
      className="mx-auto w-full max-w-xl"
      data-tour="research-search"
    >
      <div className="mb-8 text-center">
        <h2 className="text-[22px] font-semibold tracking-tight text-foreground sm:text-[26px]">
          {mode === 'cma' ? 'Run a comp analysis' : 'Find subject property'}
        </h2>
        <p className="mt-2 text-[13px] text-muted-foreground">{activeMode.hint}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError('');
            }}
            onKeyDown={handleKeyDown}
            placeholder="5721 W Prospect Dr, Visalia, CA 93291"
            className={`${inputClass} pl-10 pr-12`}
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg bg-brand-500 text-[var(--brand-foreground)] transition-colors hover:bg-brand-600 disabled:opacity-50"
            aria-label={mode === 'cma' ? 'Run CMA' : 'Research property'}
          >
            {loading ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Sparkles className="size-4" />
            )}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => persistMode(id)}
              className={clsx(
                'flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[12.5px] font-medium transition-colors',
                mode === id
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-border bg-[var(--canvas)] text-gray-700 hover:border-gray-300 hover:bg-muted/40',
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={1.8} />
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
              className={clsx(inputClass, 'py-2 text-[13px]')}
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className={clsx(inputClass, 'py-2 text-[13px]')}
              />
              <Select
                value={state}
                onChange={setState}
                placeholder="State"
                triggerClassName={clsx(inputClass, 'py-2 text-[13px]', !state && '!text-gray-400')}
                options={[{ value: '', label: 'State' }, ...states.map((s) => ({ value: s.value, label: s.label }))]}
              />
              <input
                type="text"
                inputMode="numeric"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="ZIP"
                className={clsx(inputClass, 'py-2 text-[13px]')}
              />
            </div>
          </div>
        )}

        {error && (
          <p className="mt-3 text-[12.5px] text-rose-600">{error}</p>
        )}

        {onTryDemo && (
          <p className="mt-3 text-center text-[11.5px] text-muted-foreground">
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

        {history.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.06em] text-muted-foreground">
              Recent searches
            </p>
            <ul className="max-h-40 space-y-1 overflow-y-auto">
              {history.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => onHistorySelect(entry)}
                    className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50"
                  >
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-[13px] font-medium text-foreground">
                        {entry.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(entry.lookedUpAt).toLocaleDateString()}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { BarChart2, Home, MapPin } from 'lucide-react';
import { parseAddressQuery } from '@/lib/search/parse-address';
import type { AddressSuggestion } from '@/lib/mapbox-address-suggest';
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
  { id: 'research', label: 'Owner & details', icon: Home },
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

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (!needle) return <>{text}</>;

  const lowerText = text.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  const idx = lowerText.indexOf(lowerNeedle);
  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold text-foreground">{text.slice(idx, idx + needle.length)}</span>
      {text.slice(idx + needle.length)}
    </>
  );
}

function SuggestionLabel({ suggestion, query }: { suggestion: AddressSuggestion; query: string }) {
  const street = suggestion.streetLabel || suggestion.label.split(',')[0] || suggestion.label;
  const commaIdx = suggestion.label.indexOf(',');
  const rest = commaIdx >= 0 ? suggestion.label.slice(commaIdx) : '';

  return (
    <span className="min-w-0 break-words text-[13.5px]">
      <HighlightMatch text={street} query={query} />
      {rest && <span className="font-normal text-muted-foreground">{rest}</span>}
    </span>
  );
}

const SUGGEST_FETCH_MIN = 2;

function historyMatchesQuery(entry: ResearchHistoryEntry, needle: string): boolean {
  const lower = needle.toLowerCase();
  if (entry.label.toLowerCase().includes(lower)) return true;
  if (entry.street.toLowerCase().startsWith(lower)) return true;

  const entryHouse = entry.street.match(/^(\d+)/)?.[1];
  if (/^\d+$/.test(needle) && entryHouse?.startsWith(needle)) return true;

  return false;
}

function historyToSuggestions(entries: ResearchHistoryEntry[]): AddressSuggestion[] {
  return entries.map((entry) => ({
    id: `history-${entry.id}`,
    street: entry.street,
    city: entry.city,
    state: entry.state,
    zip: entry.zip,
    label: entry.label,
    streetLabel: entry.street,
  }));
}

function mergeSuggestions(
  historyItems: AddressSuggestion[],
  remoteItems: AddressSuggestion[],
  limit = 15,
): AddressSuggestion[] {
  const seen = new Set<string>();
  const merged: AddressSuggestion[] = [];

  for (const item of [...historyItems, ...remoteItems]) {
    const key = item.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
    if (merged.length >= limit) break;
  }

  return merged;
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
}: PropertyResearchCommandBarProps) {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [showFields, setShowFields] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);
  const suggestSessionRef = useRef(crypto.randomUUID());

  useEffect(() => {
    if (!query.trim()) {
      suggestSessionRef.current = crypto.randomUUID();
    }
  }, [query]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('oikaro_research_search_mode');
      if (saved === 'research' || saved === 'cma') onModeChange(saved);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate mode once
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < SUGGEST_FETCH_MIN) {
      setSuggestions([]);
      setSuggestLoading(false);
      setHighlightIdx(-1);
      return;
    }

    setSuggestLoading(true);

    const debounceMs = /^\d{3,6}$/.test(trimmed) ? 320 : 180;
    const historyMatches = historyToSuggestions(
      history.filter((entry) => historyMatchesQuery(entry, trimmed)).slice(0, 5),
    );

    if (historyMatches.length > 0) {
      setSuggestions(historyMatches);
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const params = new URLSearchParams({
          q: trimmed,
          session: suggestSessionRef.current,
        });
        const res = await fetch(`/api/address-suggest?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (!controller.signal.aborted && data.success) {
          const remote = Array.isArray(data.data) ? (data.data as AddressSuggestion[]) : [];
          setSuggestions(mergeSuggestions(historyMatches, remote));
          setHighlightIdx(-1);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions(historyMatches);
        }
      } finally {
        if (!controller.signal.aborted) setSuggestLoading(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [history, query]);

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

  const selectSuggestion = useCallback(
    (suggestion: AddressSuggestion) => {
      setQuery(suggestion.label);
      setSuggestions([]);
      setHighlightIdx(-1);
      setShowFields(false);
      setError('');
      onSubmit(
        {
          street: suggestion.street.trim(),
          city: suggestion.city.trim(),
          state: suggestion.state,
          zip: suggestion.zip.trim(),
        },
        mode,
      );
    },
    [mode, onSubmit],
  );

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
    const trimmed = query.trim();
    const canPickSuggestion = trimmed.length > 0 && suggestions.length > 0;

    if (canPickSuggestion && event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIdx((i) => (i + 1) % suggestions.length);
      return;
    }
    if (canPickSuggestion && event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey && !loading) {
      event.preventDefault();
      if (canPickSuggestion && highlightIdx >= 0 && suggestions[highlightIdx]) {
        selectSuggestion(suggestions[highlightIdx]);
        return;
      }
      handleSubmit();
    }
  };

  const trimmedQuery = query.trim();
  const isTyping = trimmedQuery.length > 0;
  const canFetchSuggestions = trimmedQuery.length >= SUGGEST_FETCH_MIN;

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
        Look up an address
      </h2>

      <div className="mt-10 w-full max-w-2xl space-y-3">
        {/* Search input */}
        <div className="relative min-h-[140px] overflow-hidden rounded-2xl border border-border bg-[var(--canvas)] px-4 pb-12 pt-4 shadow-sm sm:min-h-[152px] sm:px-5 sm:pt-5">
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

        {/* Mode + results */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => persistMode(id)}
                className={clsx(
                  'inline-flex min-w-[148px] items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-[13px] font-semibold transition-all',
                  mode === id
                    ? 'border-brand-500 bg-brand-500 text-[var(--brand-foreground)]'
                    : 'border-border bg-[var(--canvas)] text-foreground shadow-sm hover:border-brand-400 hover:bg-muted/40',
                )}
              >
                <Icon className="size-4 shrink-0" strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>

          {isTyping ? (
            <div className="mt-4 border-t border-border/80 pt-4">
              <p className="mb-1.5 text-[12px] text-muted-foreground">Result suggestions</p>
              {!canFetchSuggestions ? (
                <p className="px-2 py-2 text-[12.5px] text-muted-foreground">
                  Keep typing an address…
                </p>
              ) : suggestLoading && suggestions.length === 0 ? (
                <p className="px-2 py-2 text-[12.5px] text-muted-foreground">Searching addresses…</p>
              ) : suggestions.length === 0 ? (
                <p className="px-2 py-2 text-[12.5px] text-muted-foreground">
                  No matching addresses — try adding city and state.
                </p>
              ) : (
                <ul className="max-h-72 space-y-0.5 overflow-y-auto pr-1">
                  {suggestions.map((suggestion, idx) => (
                    <li key={suggestion.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setHighlightIdx(idx)}
                        onClick={() => selectSuggestion(suggestion)}
                        className={clsx(
                          'flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-left transition-colors',
                          highlightIdx === idx ? 'bg-muted' : 'hover:bg-muted/60',
                        )}
                      >
                        <MapPin className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                        <SuggestionLabel suggestion={suggestion} query={query} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="mt-4 border-t border-border/80 pt-4">
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
          )}

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

          {error && <p className="mt-3 text-center text-[12.5px] text-rose-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

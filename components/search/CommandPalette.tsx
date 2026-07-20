'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import {
  Search,
  FolderKanban,
  Users,
  Inbox,
  FileText,
  Megaphone,
  Calendar,
  Sparkles,
  MapPin,
  LayoutDashboard,
  Zap,
  Loader2,
  History,
  ArrowRight,
} from 'lucide-react';
import { modalBackdrop, modalContent, useMotionReduced } from '@/lib/motion';
import { looksLikeAddress, propertyResearchHref } from '@/lib/search/parse-address';
import {
  STATIC_ACTION_ITEMS,
  STATIC_NAV_ITEMS,
  filterStaticItems,
} from '@/lib/search/static-items';
import {
  SEARCH_GROUP_LABELS,
  SEARCH_GROUP_ORDER,
  type SearchResponse,
  type SearchResult,
  type SearchResultKind,
} from '@/lib/search/types';

const HISTORY_KEY = 'oikaro_property_research_history';
const RECENT_SEARCHES_KEY = 'oikaro_command_palette_recent';

interface CommandPaletteContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  }
  return ctx;
}

function kindIcon(kind: SearchResultKind) {
  switch (kind) {
    case 'project':
      return FolderKanban;
    case 'client':
      return Users;
    case 'lead':
      return Inbox;
    case 'transaction':
      return FileText;
    case 'ad':
      return Megaphone;
    case 'event':
      return Calendar;
    case 'conversation':
      return Sparkles;
    case 'research':
      return MapPin;
    case 'nav':
      return LayoutDashboard;
    case 'action':
      return Zap;
    default:
      return Search;
  }
}

interface HistoryEntry {
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

function loadResearchHistory(): SearchResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    const entries = JSON.parse(stored) as HistoryEntry[];
    return entries.slice(0, 5).map((entry, i) => ({
      id: `history-${i}-${entry.label}`,
      kind: 'research' as const,
      title: entry.label,
      subtitle: 'Recent lookup',
      href: propertyResearchHref(entry.label),
    }));
  } catch {
    return [];
  }
}

function loadRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? (JSON.parse(stored) as string[]).slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return;
  try {
    const prev = loadRecentSearches().filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([trimmed, ...prev].slice(0, 8)));
  } catch {
    // ignore
  }
}

function CommandPaletteDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const reduced = useMotionReduced();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiResults, setApiResults] = useState<SearchResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [researchHistory, setResearchHistory] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setDebouncedQuery('');
    setApiResults(null);
    setActiveIndex(0);
    setResearchHistory(loadResearchHistory());
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(t);
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (debouncedQuery.length < 2) {
      setApiResults(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        setApiResults(json.success ? json.data : null);
      })
      .catch(() => {
        if (!cancelled) setApiResults(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, isOpen]);

  const flatResults = useMemo(() => {
    const q = query.trim();
    const items: SearchResult[] = [];

    if (q && looksLikeAddress(q)) {
      items.push({
        id: 'research-address',
        kind: 'research',
        title: `Research "${q}"`,
        subtitle: 'Property lookup & CMA',
        href: propertyResearchHref(q),
      });
    }

    if (!q) {
      items.push(...filterStaticItems(STATIC_ACTION_ITEMS, ''));
      items.push(...filterStaticItems(STATIC_NAV_ITEMS, ''));
      items.push(...researchHistory);
      return items;
    }

    items.push(...filterStaticItems(STATIC_ACTION_ITEMS, q));
    items.push(...filterStaticItems(STATIC_NAV_ITEMS, q));

    if (apiResults) {
      items.push(
        ...apiResults.projects,
        ...apiResults.clients,
        ...apiResults.leads,
        ...apiResults.transactions,
        ...apiResults.ads,
        ...apiResults.events,
        ...apiResults.conversations,
      );
    }

    return items;
  }, [query, apiResults, researchHistory]);

  const groupedResults = useMemo(() => {
    const groups = new Map<SearchResultKind, SearchResult[]>();
    for (const item of flatResults) {
      const list = groups.get(item.kind) ?? [];
      list.push(item);
      groups.set(item.kind, list);
    }
    return SEARCH_GROUP_ORDER.filter((kind) => groups.has(kind)).map((kind) => ({
      kind,
      label: SEARCH_GROUP_LABELS[kind],
      items: groups.get(kind)!,
    }));
  }, [flatResults]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, apiResults]);

  useEffect(() => {
    if (!isOpen) return;
    const el = listRef.current?.querySelector(`[data-result-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isOpen]);

  const navigateTo = useCallback(
    (item: SearchResult) => {
      saveRecentSearch(query);
      onClose();
      router.push(item.href);
    },
    [onClose, query, router],
  );

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (flatResults.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % flatResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + flatResults.length) % flatResults.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = flatResults[activeIndex];
        if (item) navigateTo(item);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, flatResults, activeIndex, navigateTo, onClose]);

  let runningIndex = -1;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          <motion.div
            className="fixed inset-0 bg-gray-950/30 backdrop-blur-[2px]"
            variants={reduced ? undefined : modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
          />
          <div className="flex min-h-full items-start justify-center px-4 pt-[12vh]">
            <motion.div
              className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-[var(--surface)] shadow-overlay ring-1 ring-gray-900/[0.06]"
              variants={reduced ? undefined : modalContent}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3">
                <Search className="h-4 w-4 shrink-0 text-gray-400" strokeWidth={2} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search projects, clients, ads, calendar…"
                  className="flex-1 bg-transparent text-[14px] text-gray-900 placeholder:text-gray-400 outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
                {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-gray-400" />}
              </div>

              <div ref={listRef} className="max-h-[min(420px,50vh)] overflow-y-auto py-2">
                {flatResults.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-700">
                    {query.trim().length >= 2 && !loading
                      ? 'No results — try a name, email, address, or page name.'
                      : 'Type to search your workspace, or pick a quick action below.'}
                  </div>
                ) : (
                  groupedResults.map((group) => (
                    <div key={group.kind} className="mb-1">
                      <p className="px-4 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-600">
                        {group.label}
                      </p>
                      {group.items.map((item) => {
                        runningIndex += 1;
                        const idx = runningIndex;
                        const Icon = kindIcon(item.kind);
                        const active = idx === activeIndex;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            data-result-index={idx}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={() => navigateTo(item)}
                            className={clsx(
                              'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                              active ? 'bg-brand-100' : 'hover:bg-gray-50',
                            )}
                          >
                            <span
                              className={clsx(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                                active ? 'bg-brand-200 text-gray-900' : 'bg-gray-100 text-gray-600',
                              )}
                            >
                              {item.subtitle === 'Recent lookup' ? (
                                <History className="h-3.5 w-3.5" strokeWidth={2} />
                              ) : (
                                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-medium text-gray-900">
                                {item.title}
                              </span>
                              {item.subtitle && (
                                <span className="block truncate text-[11.5px] text-gray-700">
                                  {item.subtitle}
                                </span>
                              )}
                            </span>
                            {active && (
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-400" strokeWidth={2} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2 text-[11px] text-gray-600">
                <span>↑↓ navigate · ↵ open · esc close</span>
                <span className="font-mono">⌘K</span>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  const value = useMemo(
    () => ({ isOpen, open, close, toggle }),
    [isOpen, open, close, toggle],
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      <CommandPaletteDialog isOpen={isOpen} onClose={close} />
    </CommandPaletteContext.Provider>
  );
}

import type { PropertyAddressFields } from '@/lib/property-research-routes';
import { formatAddressLabel } from '@/lib/property-research-routes';

export const PROPERTY_RESEARCH_HISTORY_KEY = 'oikaro_property_research_history';
export const MAX_PROPERTY_RESEARCH_HISTORY = 10;

export interface PropertyResearchHistoryEntry {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  lookedUpAt: string;
}

export function readPropertyResearchHistory(): PropertyResearchHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(PROPERTY_RESEARCH_HISTORY_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as PropertyResearchHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writePropertyResearchHistory(entries: PropertyResearchHistoryEntry[]): void {
  try {
    window.localStorage.setItem(
      PROPERTY_RESEARCH_HISTORY_KEY,
      JSON.stringify(entries.slice(0, MAX_PROPERTY_RESEARCH_HISTORY)),
    );
  } catch {
    /* ignore */
  }
}

export function appendPropertyResearchHistory(fields: PropertyAddressFields): PropertyResearchHistoryEntry[] {
  const entry: PropertyResearchHistoryEntry = {
    id: Date.now().toString(),
    label: formatAddressLabel(fields),
    street: fields.street.trim(),
    city: fields.city.trim(),
    state: fields.state.trim(),
    zip: fields.zip.trim(),
    lookedUpAt: new Date().toISOString(),
  };

  const deduped = readPropertyResearchHistory().filter(
    (item) => item.label.toLowerCase() !== entry.label.toLowerCase(),
  );
  const updated = [entry, ...deduped].slice(0, MAX_PROPERTY_RESEARCH_HISTORY);
  writePropertyResearchHistory(updated);
  return updated;
}

export function clearPropertyResearchHistory(): void {
  try {
    window.localStorage.removeItem(PROPERTY_RESEARCH_HISTORY_KEY);
  } catch {
    /* ignore */
  }
}

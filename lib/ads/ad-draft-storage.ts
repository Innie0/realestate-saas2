import type { AdDraft } from '@/lib/ads/ad-draft-types';

const STORAGE_KEY = 'oikaro-ad-draft';

export function loadAdDraft(): AdDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdDraft;
  } catch {
    return null;
  }
}

export function saveAdDraft(draft: AdDraft): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
  } catch {
    /* quota or private mode */
  }
}

export function clearAdDraft(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DASHBOARD_THEME_STORAGE_KEY,
  readInitialPreferenceFromDocument,
  readInitialThemeFromDocument,
  readStoredPreference,
  resolveDashboardTheme,
  type DashboardTheme,
  type DashboardThemePreference,
} from '@/lib/dashboard-theme';

export type { DashboardTheme, DashboardThemePreference };

type DashboardThemeContextValue = {
  /** Resolved theme applied to the UI */
  theme: DashboardTheme;
  /** Stored user preference (light / dark / system) */
  preference: DashboardThemePreference;
  setPreference: (preference: DashboardThemePreference) => void;
  /** @deprecated Use setPreference instead */
  setTheme: (theme: DashboardTheme) => void;
  /** @deprecated Use setPreference instead */
  toggleTheme: () => void;
};

const DashboardThemeContext = createContext<DashboardThemeContextValue | null>(null);

function applyDocumentTheme(theme: DashboardTheme, preference: DashboardThemePreference) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-dashboard-theme', theme);
  document.documentElement.setAttribute('data-dashboard-theme-pref', preference);
}

function withThemeSwitchGuard(apply: () => void) {
  if (typeof document === 'undefined') {
    apply();
    return;
  }
  const root = document.documentElement;
  root.classList.add('dashboard-theme-switching');
  apply();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove('dashboard-theme-switching');
    });
  });
}

export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<DashboardThemePreference>(
    readInitialPreferenceFromDocument,
  );
  const [theme, setThemeState] = useState<DashboardTheme>(readInitialThemeFromDocument);

  useEffect(() => {
    const stored = readStoredPreference();
    const resolved = resolveDashboardTheme(stored);
    setPreferenceState(stored);
    setThemeState(resolved);
    applyDocumentTheme(resolved, stored);
  }, []);

  useEffect(() => {
    applyDocumentTheme(theme, preference);
  }, [theme, preference]);

  useEffect(() => {
    if (preference !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const resolved = resolveDashboardTheme('system');
      setThemeState(resolved);
      applyDocumentTheme(resolved, 'system');
    };

    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [preference]);

  useEffect(() => {
    return () => {
      document.documentElement.removeAttribute('data-dashboard-theme');
      document.documentElement.removeAttribute('data-dashboard-theme-pref');
      document.documentElement.classList.remove('dashboard-theme-switching');
    };
  }, []);

  const setPreference = useCallback((next: DashboardThemePreference) => {
    withThemeSwitchGuard(() => {
      const resolved = resolveDashboardTheme(next);
      setPreferenceState(next);
      setThemeState(resolved);
      applyDocumentTheme(resolved, next);
      try {
        window.localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, next);
      } catch {
        /* ignore quota / private mode */
      }
    });
  }, []);

  const setTheme = useCallback(
    (next: DashboardTheme) => {
      setPreference(next);
    },
    [setPreference],
  );

  const toggleTheme = useCallback(() => {
    setPreference(theme === 'dark' ? 'light' : 'dark');
  }, [setPreference, theme]);

  const value = useMemo(
    () => ({ theme, preference, setPreference, setTheme, toggleTheme }),
    [theme, preference, setPreference, setTheme, toggleTheme],
  );

  return (
    <DashboardThemeContext.Provider value={value}>{children}</DashboardThemeContext.Provider>
  );
}

export function useDashboardTheme() {
  const ctx = useContext(DashboardThemeContext);
  if (!ctx) {
    throw new Error('useDashboardTheme must be used within DashboardThemeProvider');
  }
  return ctx;
}

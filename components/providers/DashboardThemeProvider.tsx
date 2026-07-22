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
  type DashboardTheme,
} from '@/lib/dashboard-theme';

export type { DashboardTheme };

type DashboardThemeContextValue = {
  theme: DashboardTheme;
  setTheme: (theme: DashboardTheme) => void;
  toggleTheme: () => void;
};

const DashboardThemeContext = createContext<DashboardThemeContextValue | null>(null);

function readStoredTheme(): DashboardTheme {
  if (typeof window === 'undefined') return 'light';
  try {
    return window.localStorage.getItem(DASHBOARD_THEME_STORAGE_KEY) === 'dark'
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

/** Apply theme to <html> for CSS vars + first-paint background (see globals.css). */
function applyDocumentTheme(theme: DashboardTheme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-dashboard-theme', theme);
}

function withThemeSwitchGuard(apply: () => void) {
  if (typeof document === 'undefined') {
    apply();
    return;
  }
  const root = document.documentElement;
  root.classList.add('dashboard-theme-switching');
  apply();
  // Two frames so the browser commits the new tokens before transitions resume.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove('dashboard-theme-switching');
    });
  });
}

export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  // Match blocking script / localStorage on the client so hydration class is correct.
  const [theme, setThemeState] = useState<DashboardTheme>(readStoredTheme);

  // Keep <html> in sync (blocking script may already have set this on first paint).
  useEffect(() => {
    applyDocumentTheme(theme);
  }, [theme]);

  // Only clear when leaving the dashboard — not on every theme change.
  useEffect(() => {
    return () => {
      document.documentElement.removeAttribute('data-dashboard-theme');
      document.documentElement.classList.remove('dashboard-theme-switching');
    };
  }, []);

  const setTheme = useCallback((next: DashboardTheme) => {
    withThemeSwitchGuard(() => {
      setThemeState(next);
      applyDocumentTheme(next);
      try {
        window.localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, next);
      } catch {
        /* ignore quota / private mode */
      }
    });
  }, []);

  const toggleTheme = useCallback(() => {
    withThemeSwitchGuard(() => {
      setThemeState((prev) => {
        const next: DashboardTheme = prev === 'dark' ? 'light' : 'dark';
        applyDocumentTheme(next);
        try {
          window.localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, next);
        } catch {
          /* ignore */
        }
        return next;
      });
    });
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
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

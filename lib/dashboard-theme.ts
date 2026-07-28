export type DashboardTheme = 'dark' | 'light';

/** Stored user preference — `system` follows OS color scheme. */
export type DashboardThemePreference = DashboardTheme | 'system';

export const DASHBOARD_THEME_STORAGE_KEY = 'oikaro-dashboard-theme';

export function resolveDashboardTheme(preference: DashboardThemePreference): DashboardTheme {
  if (preference === 'system') {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return preference;
}

function readStoredPreference(): DashboardThemePreference {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(DASHBOARD_THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    /* ignore */
  }
  return 'light';
}

/**
 * Inline script for the dashboard layout — runs before paint.
 * Default light (matches landing); dark/system are opt-in via localStorage.
 */
export const DASHBOARD_THEME_INIT_SCRIPT = `(function(){
  try {
    var s = localStorage.getItem(${JSON.stringify(DASHBOARD_THEME_STORAGE_KEY)});
    var pref = s === 'dark' || s === 'system' ? s : 'light';
    var t = pref === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : pref;
    document.documentElement.setAttribute('data-dashboard-theme', t);
    document.documentElement.setAttribute('data-dashboard-theme-pref', pref);
  } catch (e) {
    document.documentElement.setAttribute('data-dashboard-theme', 'light');
    document.documentElement.setAttribute('data-dashboard-theme-pref', 'light');
  }
})();`;

export { readStoredPreference };

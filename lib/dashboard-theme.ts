export type DashboardTheme = 'dark' | 'light';

export const DASHBOARD_THEME_STORAGE_KEY = 'oikaro-dashboard-theme';

/**
 * Inline script for the dashboard layout — runs before paint.
 * Default dark (matches landing); light is opt-in via localStorage.
 */
export const DASHBOARD_THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem(${JSON.stringify(DASHBOARD_THEME_STORAGE_KEY)});var t=s==='light'?'light':'dark';document.documentElement.setAttribute('data-dashboard-theme',t);}catch(e){document.documentElement.setAttribute('data-dashboard-theme','dark');}})();`;

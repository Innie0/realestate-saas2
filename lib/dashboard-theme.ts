export type DashboardTheme = 'dark' | 'light';

export const DASHBOARD_THEME_STORAGE_KEY = 'oikaro-dashboard-theme';

/**
 * Inline script for the dashboard layout — runs before paint so light mode
 * does not flash the dark :root canvas on refresh.
 */
export const DASHBOARD_THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(DASHBOARD_THEME_STORAGE_KEY)})==='light'?'light':'dark';document.documentElement.setAttribute('data-dashboard-theme',t);}catch(e){document.documentElement.setAttribute('data-dashboard-theme','dark');}})();`;

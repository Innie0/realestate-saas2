/** Read a marketing CSS custom property from :root (for GSAP / runtime animation). */
const MKT_VAR_FALLBACKS: Record<string, string> = {
  '--mkt-text-primary': '#ffffff',
  '--mkt-text-secondary': '#a3a3a3',
  '--mkt-border': '#2e2e2e',
  '--mkt-nav-scrolled-bg': 'rgba(10, 10, 10, 0.88)',
  '--mkt-nav-menu-bg': 'rgba(10, 10, 10, 0.94)',
  '--mkt-nav-transparent-bg': 'rgba(10, 10, 10, 0)',
  '--mkt-nav-transparent-border': 'rgba(46, 46, 46, 0)',
  '--mkt-hero-glow': 'rgba(228, 247, 108, 0.14)',
};

export function mktVar(name: `--mkt-${string}`): string {
  if (typeof window === 'undefined') {
    return MKT_VAR_FALLBACKS[name] ?? '';
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || MKT_VAR_FALLBACKS[name] || '';
}

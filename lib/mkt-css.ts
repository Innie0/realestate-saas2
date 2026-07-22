/** Read a marketing CSS custom property from :root (for GSAP / runtime animation). */
const MKT_VAR_FALLBACKS: Record<string, string> = {
  '--mkt-text-primary': '#111111',
  '--mkt-text-secondary': '#787774',
  '--mkt-border': '#eaeaea',
  '--mkt-nav-scrolled-bg': 'rgba(251, 251, 250, 0.92)',
  '--mkt-nav-menu-bg': 'rgba(251, 251, 250, 0.96)',
  '--mkt-nav-transparent-bg': 'rgba(251, 251, 250, 0)',
  '--mkt-nav-transparent-border': 'rgba(234, 234, 234, 0)',
  '--mkt-hero-glow': 'rgba(248, 235, 210, 0.75)',
};

export function mktVar(name: `--mkt-${string}`): string {
  if (typeof window === 'undefined') {
    return MKT_VAR_FALLBACKS[name] ?? '';
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || MKT_VAR_FALLBACKS[name] || '';
}

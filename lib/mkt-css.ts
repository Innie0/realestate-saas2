/** Read a marketing CSS custom property from :root (for GSAP / runtime animation). */
const MKT_VAR_FALLBACKS: Record<string, string> = {
  '--mkt-text-primary': '#1a2e1a',
  '--mkt-text-secondary': '#5c665c',
  '--mkt-border': '#e5e0d6',
  '--mkt-nav-scrolled-bg': 'rgba(250, 247, 242, 0.92)',
  '--mkt-nav-menu-bg': 'rgba(250, 247, 242, 0.96)',
  '--mkt-nav-transparent-bg': 'rgba(250, 247, 242, 0)',
  '--mkt-nav-transparent-border': 'rgba(229, 224, 214, 0)',
  '--mkt-hero-glow': 'rgba(232, 240, 232, 0.9)',
};

export function mktVar(name: `--mkt-${string}`): string {
  if (typeof window === 'undefined') {
    return MKT_VAR_FALLBACKS[name] ?? '';
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || MKT_VAR_FALLBACKS[name] || '';
}

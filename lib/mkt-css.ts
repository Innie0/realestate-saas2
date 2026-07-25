/** Read a marketing CSS custom property (prefers `.marketing-root` when present). */
const MKT_VAR_FALLBACKS: Record<string, string> = {
  '--mkt-text-primary': '#111111',
  '--mkt-text-secondary': '#5c5650',
  '--mkt-border': '#e8e4de',
  '--mkt-nav-scrolled-bg': 'rgba(250, 248, 245, 0.92)',
  '--mkt-nav-menu-bg': 'rgba(250, 248, 245, 0.98)',
  '--mkt-nav-transparent-bg': 'rgba(250, 248, 245, 0)',
  '--mkt-nav-transparent-border': 'rgba(232, 228, 222, 0)',
  '--mkt-hero-glow': 'rgba(53, 72, 199, 0.14)',
};

export function mktVar(name: `--mkt-${string}`): string {
  if (typeof window === 'undefined') {
    return MKT_VAR_FALLBACKS[name] ?? '';
  }
  const el = document.querySelector('.marketing-root') ?? document.documentElement;
  const value = getComputedStyle(el).getPropertyValue(name).trim();
  return value || MKT_VAR_FALLBACKS[name] || '';
}

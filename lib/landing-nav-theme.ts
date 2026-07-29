export const CONNECT_TOOLS_NAV_SENTINEL_ID = 'connect-tools-sentinel';
export const CONNECT_TOOLS_SECTION_ID = 'connect-tools-section';

export function getLandingNavHeight(): number {
  if (typeof window === 'undefined') return 72;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--mkt-nav-height').trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 72;
}

export function isConnectToolsNavDark(): boolean {
  const sentinel = document.getElementById(CONNECT_TOOLS_NAV_SENTINEL_ID);
  const section = document.getElementById(CONNECT_TOOLS_SECTION_ID);
  if (!sentinel || !section) return false;

  const navHeight = getLandingNavHeight();
  const sentinelTop = sentinel.getBoundingClientRect().top;
  const sectionBottom = section.getBoundingClientRect().bottom;

  return sentinelTop <= navHeight && sectionBottom > navHeight;
}

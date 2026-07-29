export const CONNECT_TOOLS_NAV_SENTINEL_ID = 'connect-tools-sentinel';
export const CONNECT_TOOLS_SECTION_ID = 'connect-tools-section';
export const CONNECT_TOOLS_CURTAIN_ID = 'connect-tools-curtain';

export function getLandingNavHeight(): number {
  if (typeof window === 'undefined') return 72;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--mkt-nav-height').trim();
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 72;
}

export function isConnectToolsNavDark(): boolean {
  const sentinel = document.getElementById(CONNECT_TOOLS_NAV_SENTINEL_ID);
  const curtain = document.getElementById(CONNECT_TOOLS_CURTAIN_ID);
  if (!sentinel || !curtain) return false;

  const navHeight = getLandingNavHeight();
  const sentinelTop = sentinel.getBoundingClientRect().top;
  const curtainBottom = curtain.getBoundingClientRect().bottom;

  return sentinelTop <= navHeight && curtainBottom > navHeight;
}

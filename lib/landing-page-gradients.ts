/** Shared hero + lower-page dissolve — keep stops mirrored for a seamless landing scroll. */

export const HERO_BASE_GRADIENT =
  'linear-gradient(180deg,#0452AD 0%,#0668E1 34%,#2E86FB 68%,#4B93FC 100%)';

/** Soft white wash layered over the hero base — long ease-out into white. */
export const HERO_FADE_OVERLAY =
  'linear-gradient(180deg,transparent 0%,rgba(220,235,254,0.18) 14%,rgba(220,235,254,0.42) 30%,rgba(235,244,255,0.68) 46%,rgba(247,251,255,0.88) 62%,#F5F9FF 78%,#FFFFFF 92%,#FFFFFF 100%)';

export const HERO_FADE_HEIGHT = 'min(580px,60%)';

/** Mirror of the hero fade — white section back into brand blue before FAQ. */
export const PAGE_BOTTOM_FADE_OVERLAY =
  'linear-gradient(180deg,transparent 0%,rgba(247,251,255,0.28) 12%,rgba(235,244,255,0.48) 26%,rgba(220,235,254,0.66) 40%,rgba(168,204,254,0.8) 52%,rgba(127,180,253,0.9) 64%,rgba(75,147,252,0.96) 76%,rgba(46,134,251,0.99) 86%,#0668E1 94%,#0668E1 100%)';

export const PAGE_BOTTOM_FADE_HEIGHT = 'min(420px,48vw)';

/** Editorial landing tokens — warm monochrome, premium B2B */
export const MKT = {
  background: '#FBFBFA',
  surface: '#FFFFFF',
  surfaceMuted: '#F7F6F3',
  textPrimary: '#111111',
  textSecondary: '#787774',
  border: '#EAEAEA',
  /** Primary CTA — charcoal for trust; brand lime lives in product UI */
  accent: '#111111',
  accentHover: '#333333',
  accentForeground: '#FFFFFF',
  muted: '#A3A29E',
  /** Product mock / screenshot interior */
  mockSurface: '#FFFFFF',
  browserDot: '#D4D4D0',
  maxContentWidth: 1120,
  radius: { button: 6, card: 12, browser: 12 },
  /** Muted pastels for tags */
  tag: {
    green: { bg: '#EDF3EC', text: '#346538' },
    blue: { bg: '#E1F3FE', text: '#1F6C9F' },
    amber: { bg: '#FBF3DB', text: '#956400' },
  },
} as const;

/** @deprecated Use LandingScrollReveal + GSAP instead */
export const mktEnterReveal = (reduced: boolean, delay = 0) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-40px' as const },
        transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
      };

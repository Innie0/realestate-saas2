/** Framer-style landing tokens — dark background, white text */
export const MKT = {
  background: '#000000',
  surface: '#111111',
  textPrimary: '#FFFFFF',
  textSecondary: '#999999',
  border: '#2A2A2A',
  accent: '#E4F76C',
  accentHover: '#D8EB5A',
  accentForeground: '#141412',
  /** Inactive / muted UI — never use accent for decorative chrome */
  muted: '#666666',
  /** Product mock / screenshot interior — stays light inside browser frames */
  mockSurface: '#FFFFFF',
  browserDot: '#444444',
  maxContentWidth: 1200,
  radius: { button: 8, card: 12, browser: 10 },
} as const;

/** IntersectionObserver fade-up — once only, not scroll-linked */
export const mktEnterReveal = (reduced: boolean, delay = 0) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-40px' as const },
        transition: { duration: 0.4, delay, ease: 'easeOut' as const },
      };

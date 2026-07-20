/** Framer-style landing tokens — framer-style-cursor-prompt.md */
export const MKT = {
  background: '#F7F6F0',
  surface: '#FFFFFF',
  textPrimary: '#141412',
  textSecondary: '#6B6A64',
  border: '#E7E5DD',
  accent: '#E4F76C',
  accentHover: '#D8EB5A',
  accentForeground: '#141412',
  /** Inactive / muted UI — never use accent for decorative chrome */
  muted: '#A8A7A1',
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

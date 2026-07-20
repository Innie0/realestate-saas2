/** design.md §2–4 — shared landing page tokens */
export const MKT = {
  background: '#F7F6F3',
  surface: '#FFFFFF',
  textPrimary: '#1A1A18',
  textSecondary: '#6B6862',
  accentMuted: '#B8C4B4',
  border: '#E4E2DC',
  /** Brand lime — primary CTAs */
  accent: '#D9ED41',
  accentHover: '#C9DD38',
  accentForeground: '#18181B',
  maxContentWidth: 1200,
  shadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)',
  radius: { sm: 6, md: 10, lg: 16 },
} as const;

/** design.md §8 — small on-enter reveals only (not pinned sequences) */
export const mktEnterReveal = (reduced: boolean, delay = 0) =>
  reduced
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-40px' as const },
        transition: { duration: 0.45, delay, ease: [0.25, 0.1, 0.25, 1] as const },
      };

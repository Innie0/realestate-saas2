/** Editorial marketing tokens — Forest Canopy (warm cream + deep forest accent) */
export const MKT = {
  background: '#FAF7F2',
  surface: '#FFFCF7',
  surfaceMuted: '#F3F0EA',
  textPrimary: '#1A2E1A',
  textSecondary: '#5C665C',
  border: '#E5E0D6',
  /** Primary CTA — deep forest green; product UI keeps lime brand */
  accent: '#15803D',
  accentHover: '#166534',
  accentForeground: '#FFFFFF',
  muted: '#8A938A',
  /** Product mock / screenshot interior */
  mockSurface: '#FFFFFF',
  browserDot: '#D4CFC4',
  /** Nav blur + hero glow (canvas-tinted, not pure white) */
  navScrolledBg: 'rgba(250, 247, 242, 0.92)',
  navMenuBg: 'rgba(250, 247, 242, 0.96)',
  heroGlow: 'rgba(232, 240, 232, 0.9)',
  maxContentWidth: 1120,
  radius: { button: 6, card: 12, browser: 12 },
  /** Muted pastels harmonized with forest accent */
  tag: {
    green: { bg: '#E8F0E8', text: '#1B4332' },
    blue: { bg: '#E8EDE8', text: '#2D4A35' },
    amber: { bg: '#F5EFE6', text: '#7A5C3A' },
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

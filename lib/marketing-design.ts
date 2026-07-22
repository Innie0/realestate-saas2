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

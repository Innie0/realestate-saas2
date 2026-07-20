'use client';

import { useRef } from 'react';
import Link from 'next/link';
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import HeroProductScreenshot from '@/components/home/HeroProductScreenshot';
import { MKT } from '@/lib/marketing-design';
import { useMotionReduced } from '@/lib/motion';

type CinematicHeroSectionProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
};

/**
 * Scroll-scrubbed pinned hero (design.md §8):
 * - pin for ~150vh of scroll distance (sticky viewport + 150vh track)
 * - scroll progress cross-fades product screenshot ↔ subtle background treatment
 * - scrubbed (reverses on scroll up); reduced-motion collapses to a static frame
 */
export default function CinematicHeroSection({ sectionRef }: CinematicHeroSectionProps) {
  const trackRef = useRef<HTMLElement | null>(null);
  const reduced = useMotionReduced();

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  });

  const productOpacity = useTransform(scrollYProgress, [0, 0.35, 0.75], [1, 1, 0]);
  const productY = useTransform(scrollYProgress, [0, 0.75], [0, 32]);
  const productScale = useTransform(scrollYProgress, [0, 0.75], [1, 0.97]);
  const productParallax = useTransform(scrollYProgress, [0, 1], [0, -28]);
  const productTranslateY = useTransform(
    [productY, productParallax],
    ([yVal, pVal]) => Number(yVal) + Number(pVal),
  );

  const treatmentOpacity = useTransform(scrollYProgress, [0.25, 0.55, 0.9], [0, 0.55, 1]);
  const treatmentParallax = useTransform(scrollYProgress, [0, 1], [0, -48]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.55, 0.85], [1, 1, 0.35]);

  const setRefs = (node: HTMLElement | null) => {
    trackRef.current = node;
    if (sectionRef && 'current' in sectionRef) {
      (sectionRef as React.MutableRefObject<HTMLElement | null>).current = node;
    }
  };

  return (
    <section
      ref={setRefs}
      className="relative"
      style={{ height: reduced ? 'auto' : '250vh' }}
    >
      <div
        className={`relative flex flex-col overflow-hidden ${
          reduced ? 'min-h-[100svh]' : 'sticky top-0 h-[100svh]'
        }`}
        style={{ backgroundColor: MKT.background }}
      >
        <HeroTreatmentLayer
          reduced={reduced}
          opacity={treatmentOpacity}
          y={treatmentParallax}
        />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col pt-16 sm:pt-20 md:pt-24">
          <div
            className="mx-auto flex w-full min-w-0 flex-1 flex-col items-center px-4 pb-8 pt-8 sm:px-6 sm:pb-12 sm:pt-12 lg:px-8"
            style={{ maxWidth: MKT.maxContentWidth }}
          >
            <motion.div
              className="mx-auto w-full text-center"
              style={reduced ? undefined : { opacity: copyOpacity }}
            >
              <p
                className="font-mono text-[12px] font-medium uppercase tracking-[0.14em]"
                style={{ color: MKT.textSecondary }}
              >
                Real estate workspace
              </p>

              <h1
                className="mt-4 font-sans text-[2rem] font-medium leading-[1.1] tracking-[-0.02em] sm:mt-6 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]"
                style={{ color: MKT.textPrimary }}
              >
                Your entire business,
                <br />
                one workspace
              </h1>

              <p
                className="mx-auto mt-4 max-w-lg text-base font-normal leading-[1.6] sm:mt-6"
                style={{ color: MKT.textSecondary }}
              >
                Listings, leads, research, and deals — finally in one place. Stop juggling
                spreadsheets, forms, and five different apps.
              </p>

              <div className="mt-6 sm:mt-8">
                <Link href="/auth/signup" className="inline-block w-full sm:w-auto">
                  <span
                    className="group inline-flex w-full items-center justify-center gap-2 px-8 py-3.5 text-base font-medium transition-opacity hover:opacity-90 sm:w-auto"
                    style={{
                      backgroundColor: MKT.accent,
                      color: MKT.accentForeground,
                      borderRadius: MKT.radius.md,
                      boxShadow: MKT.shadow,
                    }}
                  >
                    Start free trial
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
                <p className="mt-3 text-sm leading-[1.6]" style={{ color: MKT.textSecondary }}>
                  7 days free · No setup fees · Cancel anytime
                </p>
              </div>
            </motion.div>

            <motion.div
              className="relative mt-8 w-full min-w-0 max-w-[820px] sm:mt-10 lg:mt-12 xl:max-w-[880px]"
              style={
                reduced
                  ? { borderRadius: MKT.radius.lg, boxShadow: MKT.shadow }
                  : {
                      opacity: productOpacity,
                      y: productTranslateY,
                      scale: productScale,
                      borderRadius: MKT.radius.lg,
                      boxShadow: MKT.shadow,
                    }
              }
            >
              <HeroProductScreenshot />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroTreatmentLayer({
  reduced,
  opacity,
  y,
}: {
  reduced: boolean;
  opacity: MotionValue<number>;
  y: MotionValue<number>;
}) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={reduced ? { opacity: 0.85 } : { opacity, y }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 55% at 50% 40%, ${MKT.accentMuted}33 0%, transparent 70%),
            linear-gradient(180deg, ${MKT.background} 0%, ${MKT.accentMuted}22 100%)
          `,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `radial-gradient(circle, ${MKT.textPrimary}0A 0.6px, transparent 0.7px)`,
          backgroundSize: '12px 12px',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-px" style={{ backgroundColor: MKT.border }} />
    </motion.div>
  );
}

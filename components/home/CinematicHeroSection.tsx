'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import BrowserWindowFrame from '@/components/home/BrowserWindowFrame';
import HeroAssistantPreview from '@/components/home/HeroAssistantPreview';
import { MKT, mktEnterReveal } from '@/lib/marketing-design';
import { useMotionReduced } from '@/lib/motion';

type CinematicHeroSectionProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
};

export default function CinematicHeroSection({ sectionRef }: CinematicHeroSectionProps) {
  const reduced = useMotionReduced();

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="relative border-b"
      style={{ borderColor: MKT.border, backgroundColor: MKT.background }}
    >
      <div
        className="mx-auto px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-28 md:pt-32 lg:px-8"
        style={{ maxWidth: MKT.maxContentWidth }}
      >
        <motion.div {...mktEnterReveal(reduced)} className="mx-auto max-w-3xl text-center">
          <h1
            className="text-[2rem] font-medium leading-[1.12] tracking-[-0.02em] sm:text-5xl lg:text-[3.25rem]"
            style={{ color: MKT.textPrimary }}
          >
            Your entire business,
            <br />
            one workspace
          </h1>

          <p
            className="mx-auto mt-5 max-w-lg text-base font-normal leading-[1.6]"
            style={{ color: MKT.textSecondary }}
          >
            Listings, leads, research, and deals — finally in one place. Stop juggling
            spreadsheets, forms, and five different apps.
          </p>

          <div className="mt-8">
            <Link href="/auth/signup" className="inline-block w-full sm:w-auto">
              <span
                className="group inline-flex w-full items-center justify-center gap-2 px-8 py-3.5 text-base font-medium transition-opacity hover:opacity-90 sm:w-auto"
                style={{
                  backgroundColor: MKT.accent,
                  color: MKT.accentForeground,
                  borderRadius: MKT.radius.button,
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
          {...mktEnterReveal(reduced, 0.08)}
          className="relative mx-auto mt-12 w-full max-w-[880px] sm:mt-14"
        >
          <BrowserWindowFrame>
            <HeroAssistantPreview animateWhenVisible compactChrome />
          </BrowserWindowFrame>
        </motion.div>
      </div>
    </section>
  );
}

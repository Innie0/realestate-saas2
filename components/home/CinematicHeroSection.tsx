'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import HeroAssistantPreview from '@/components/home/HeroAssistantPreview';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: 'easeOut' as const },
  },
};

type CinematicHeroSectionProps = {
  sectionRef: React.RefObject<HTMLElement | null>;
};

export default function CinematicHeroSection({ sectionRef }: CinematicHeroSectionProps) {
  return (
    <section
      ref={sectionRef as React.RefObject<HTMLElement>}
      className="relative min-h-[100svh] overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, #0a0a0a 0%, #0a0a0a 50%, #2a2a2a 72%, #ffffff 100%)',
      }}
    >
      <div className="relative z-10 flex min-h-[100svh] flex-col pt-16 sm:pt-20 md:pt-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col items-center px-4 pb-12 pt-6 sm:px-6 sm:pb-16 sm:pt-10 lg:px-8 lg:pb-20"
        >
          <div className="mx-auto max-w-3xl text-center">
            <motion.h1
              variants={itemVariants}
              className="text-3xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Your entire business,
              <br />
              one workspace
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/75 sm:mt-6 sm:text-lg"
            >
              Listings, leads, research, and deals — finally in one place. Stop juggling spreadsheets, forms, and five different apps.
            </motion.p>

            <motion.div variants={itemVariants} className="mt-7 sm:mt-8">
              <Link href="/auth/signup" className="inline-block w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255,255,255,0.2)' }}
                  whileTap={{ scale: 0.98 }}
                  className="mkt-cta group flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold sm:w-auto"
                >
                  Start free trial
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </motion.button>
              </Link>
              <p className="mt-3 text-sm text-white/45">7 days free · No setup fees · Cancel anytime</p>
            </motion.div>
          </div>

          <motion.div
            variants={itemVariants}
            className="relative mt-8 w-full min-w-0 max-w-[820px] sm:mt-10 lg:mt-12 xl:max-w-[880px]"
          >
            <HeroAssistantPreview showBackdrop={false} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

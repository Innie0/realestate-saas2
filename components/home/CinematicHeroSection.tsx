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
    <section ref={sectionRef as React.RefObject<HTMLElement>} className="relative min-h-[100svh] overflow-hidden bg-[#0a0a0a]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,rgba(252,92,3,0.08),transparent_65%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#F5F5F5] to-transparent sm:h-48" />
      </div>

      <div className="relative z-10 flex min-h-[100svh] flex-col pt-16 sm:pt-20 md:pt-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col items-center px-4 pb-8 pt-8 sm:px-6 sm:pt-14 lg:px-8 lg:pb-12"
        >
          <div className="mx-auto max-w-3xl text-center">
            <motion.h1
              variants={itemVariants}
              className="font-display text-3xl font-medium italic leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-7xl"
            >
              Work Smarter
              <br />
              Close Faster
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:mt-8 sm:text-lg"
            >
              Transform your workflow as a real estate agent with intelligent tools designed for you.
              Manage leads, schedule showings, and close more deals with our AI-powered platform.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-4"
            >
              <Link href="/auth/signup" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(255,255,255,0.2)' }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-brand-600 sm:w-auto"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </motion.button>
              </Link>
              <Link href="/auth/login" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.12)' }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-xl border border-white/35 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all sm:w-auto"
                >
                  Sign In
                </motion.button>
              </Link>
            </motion.div>
          </div>

          {/* Product UI */}
          <motion.div
            variants={itemVariants}
            className="relative mt-10 w-full min-w-0 max-w-[820px] sm:mt-12 lg:mt-14 xl:max-w-[880px]"
          >
            <HeroAssistantPreview showBackdrop={false} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import LandingNav from '@/components/home/LandingNav';
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

export default function CinematicHeroSection() {
  const heroRef = useRef<HTMLElement>(null);

  return (
    <section ref={heroRef} className="relative min-h-[100svh] overflow-hidden">
      <LandingNav heroRef={heroRef} />

      {/* Mountain landscape — peaks visible on the sides, valley in the center */}
      <div className="absolute inset-0" aria-hidden>
        <Image
          src="/landing/hero-mountains.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-[#F5F5F5]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#F5F5F5] via-[#F5F5F5]/80 to-transparent" />
        {/* Side vignette — draws focus to the center product frame */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_72%_58%_at_50%_42%,transparent_0%,rgba(0,0,0,0.35)_100%)]" />
      </div>

      <div className="relative z-10 flex min-h-[100svh] flex-col pt-20 sm:pt-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center px-6 pb-8 pt-10 sm:pt-14 lg:px-8 lg:pb-12"
        >
          <div className="mx-auto max-w-3xl text-center">
            <motion.div variants={itemVariants} className="mb-6 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-brand-400" />
                AI-Powered Real Estate Platform
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="font-display text-4xl font-medium italic leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-7xl"
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

          {/* Product UI nestled in the mountain valley */}
          <motion.div
            variants={itemVariants}
            className="relative mt-12 w-full max-w-[820px] lg:mt-14 xl:max-w-[880px]"
          >
            <div className="hidden lg:block">
              <HeroAssistantPreview showBackdrop={false} />
            </div>
            <div className="lg:hidden">
              <div className="overflow-hidden rounded-2xl border border-white/25 bg-white/95 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.45)] ring-1 ring-white/20">
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src="/landing/hero-assistant.png"
                    alt="Oikaro AI Assistant"
                    fill
                    className="object-cover object-top"
                    sizes="100vw"
                    priority
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

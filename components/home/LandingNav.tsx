'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import WordmarkLogo from '@/components/branding/WordmarkLogo';

type LandingNavProps = {
  /** Ref to an element at the hero → solid-content transition; nav inverts when it scrolls past. */
  scrollSentinelRef: React.RefObject<HTMLElement | null>;
};

export default function LandingNav({ scrollSentinelRef }: LandingNavProps) {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const sentinel = scrollSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setSolid(!entry.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px', threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [scrollSentinelRef]);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 ease-out ${
        solid
          ? 'border-b border-gray-200 bg-[#F5F5F5]/95 shadow-sm backdrop-blur-md'
          : 'border-b border-white/10 bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 sm:h-24 items-center justify-between">
          <motion.div className="flex shrink-0 items-center" whileHover={{ scale: 1.02 }}>
            <WordmarkLogo theme={solid ? 'dark' : 'light'} className="h-8 sm:h-10 w-auto object-contain" />
          </motion.div>
          <div className="flex-1" />
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/auth/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 sm:px-5 py-2.5 text-sm font-medium transition-colors ${
                  solid
                    ? 'text-gray-600 hover:text-brand-600'
                    : 'text-white/90 hover:text-white'
                }`}
              >
                Sign In
              </motion.button>
            </Link>
            <Link href="/auth/signup">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(252,92,3,0.25)' }}
                whileTap={{ scale: 0.98 }}
                className="px-4 sm:px-5 py-2.5 text-sm font-medium rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
              >
                Get Started
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

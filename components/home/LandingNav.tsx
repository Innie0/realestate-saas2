'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTopOverscrollPull } from '@/lib/use-top-overscroll-pull';

type LandingNavProps = {
  heroRef: React.RefObject<HTMLElement | null>;
};

export default function LandingNav({ heroRef }: LandingNavProps) {
  const [solid, setSolid] = useState(false);
  const onHero = !solid;
  const pull = useTopOverscrollPull(onHero);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const update = () => {
      const { bottom } = hero.getBoundingClientRect();
      setSolid(bottom <= 96);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [heroRef]);

  const blurPx = Math.round(pull * 22);
  const frostBg = `rgba(255, 255, 255, ${pull * 0.32})`;
  const frostFilter = pull > 0.02 ? `blur(${blurPx}px) saturate(1.15)` : undefined;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className={`fixed inset-x-0 top-0 z-50 ${
        solid
          ? 'border-b border-gray-200 bg-[#F5F5F5]/95 shadow-sm backdrop-blur-md transition-[background-color,border-color,box-shadow] duration-300 ease-out'
          : 'border-b border-transparent'
      }`}
      style={
        onHero
          ? {
              backgroundColor: pull > 0.01 ? frostBg : 'transparent',
              backdropFilter: frostFilter,
              WebkitBackdropFilter: frostFilter,
              boxShadow:
                pull > 0.04 ? `inset 0 1px 0 rgba(255,255,255,${pull * 0.45})` : undefined,
            }
          : undefined
      }
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 sm:h-24 items-center justify-between">
          <motion.div className="flex shrink-0 items-center" whileHover={{ scale: 1.02 }}>
            <Link
              href="/"
              className={`font-mono text-[1.35rem] font-semibold tracking-[-0.04em] transition-colors duration-300 sm:text-[1.5rem] ${
                solid ? 'text-gray-900' : 'text-white'
              }`}
            >
              Oikaro
            </Link>
          </motion.div>
          <div className="flex-1" />
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/auth/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 sm:px-5 py-2.5 text-sm font-medium transition-colors duration-300 ${
                  solid
                    ? 'text-gray-600 hover:text-brand-600'
                    : 'text-white hover:text-white/80'
                }`}
              >
                Sign In
              </motion.button>
            </Link>
            <Link href="/auth/signup">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 sm:px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                  solid
                    ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-[0_0_30px_rgba(252,92,3,0.25)]'
                    : 'border border-white/70 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20'
                }`}
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

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ProductsMegaMenu from '@/components/marketing/ProductsMegaMenu';

type LandingNavProps = {
  heroRef: React.RefObject<HTMLElement | null>;
  darkBandRef: React.RefObject<HTMLElement | null>;
};

export default function LandingNav({ heroRef, darkBandRef }: LandingNavProps) {
  const [inHero, setInHero] = useState(true);
  const [inDarkBand, setInDarkBand] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const hero = heroRef.current;
      const dark = darkBandRef.current;
      const navThreshold = 96;

      if (hero) {
        const { bottom } = hero.getBoundingClientRect();
        setInHero(bottom > navThreshold);
      }

      if (dark) {
        const { top, bottom } = dark.getBoundingClientRect();
        setInDarkBand(top <= navThreshold && bottom > navThreshold);
      } else {
        setInDarkBand(false);
      }
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [heroRef, darkBandRef]);

  const showTransparentNav = inHero && !menuOpen;
  const showLightSolidBar = !inHero && !inDarkBand;
  const lightNavText = inHero || inDarkBand;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className={`fixed inset-x-0 top-0 z-[60] transition-[background-color,border-color,box-shadow] duration-300 ease-out ${
        showTransparentNav
          ? 'border-b border-transparent bg-transparent'
          : inDarkBand
            ? 'border-b border-white/10 bg-[#0a0a0a] shadow-sm'
            : 'border-b border-gray-200 bg-[#F5F5F5] shadow-sm'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 md:h-24 items-center justify-between gap-2 min-w-0">
          <motion.div className="flex min-w-0 shrink-0 items-center" whileHover={{ scale: 1.02 }}>
            <Link
              href="/"
              className={`truncate font-mono text-[1.15rem] font-semibold tracking-[-0.04em] transition-colors duration-300 sm:text-[1.35rem] md:text-[1.5rem] ${
                lightNavText ? 'text-white' : 'text-gray-900'
              }`}
            >
              Oikaro
            </Link>
          </motion.div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
            <ProductsMegaMenu onSolidBackground={showLightSolidBar} onOpenChange={setMenuOpen} />
            <Link href="/auth/login" className="hidden md:block">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className={`whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors duration-300 md:px-4 md:py-2.5 ${
                  lightNavText ? 'text-white hover:text-white/80' : 'text-gray-600 hover:text-brand-600'
                }`}
              >
                Sign In
              </motion.button>
            </Link>
            <Link href="/auth/signup">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className={`whitespace-nowrap px-3 py-2 text-xs font-medium rounded-lg transition-all duration-300 sm:px-4 sm:py-2.5 sm:text-sm ${
                  showLightSolidBar
                    ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-[0_0_30px_rgba(252,92,3,0.25)]'
                    : 'border border-white/70 bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span className="sm:hidden">Start</span>
                <span className="hidden sm:inline">Get Started</span>
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

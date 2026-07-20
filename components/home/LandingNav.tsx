'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ProductsMegaMenu from '@/components/marketing/ProductsMegaMenu';

type LandingNavProps = {
  heroRef: React.RefObject<HTMLElement | null>;
};

export default function LandingNav({ heroRef }: LandingNavProps) {
  const [inHero, setInHero] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const hero = heroRef.current;
      const navThreshold = 96;

      if (hero) {
        const { bottom } = hero.getBoundingClientRect();
        setInHero(bottom > navThreshold);
      }
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [heroRef]);

  // Light hero (#F7F6F3): keep dark type; only swap to solid white once past the pin.
  const overHero = inHero && !menuOpen;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className={`fixed inset-x-0 top-0 z-[60] transition-[background-color,border-color,box-shadow] duration-300 ease-out ${
        overHero
          ? 'border-b border-transparent bg-transparent'
          : 'border-b border-[#E4E2DC] bg-white/95 shadow-sm backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 md:h-24 items-center justify-between gap-2 min-w-0">
          <motion.div className="flex min-w-0 shrink-0 items-center" whileHover={{ scale: 1.02 }}>
            <Link
              href="/"
              className="truncate font-mono text-[1.15rem] font-semibold tracking-[-0.04em] text-[#1A1A18] transition-opacity hover:opacity-80 sm:text-[1.35rem] md:text-[1.5rem]"
            >
              Oikaro
            </Link>
          </motion.div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-3">
            <ProductsMegaMenu onSolidBackground onOpenChange={setMenuOpen} />
            <Link href="/auth/login" className="hidden md:block">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="whitespace-nowrap px-3 py-2 text-sm font-medium text-[#6B6862] transition-colors hover:text-[#1A1A18] md:px-4 md:py-2.5"
              >
                Sign In
              </motion.button>
            </Link>
            <Link href="/auth/signup">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="whitespace-nowrap rounded-[10px] px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 sm:px-4 sm:py-2.5 sm:text-sm"
                style={{ backgroundColor: '#2F3A2E' }}
              >
                Start free trial
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

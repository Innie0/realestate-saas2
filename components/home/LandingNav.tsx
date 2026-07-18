'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ProductsMegaMenu from '@/components/marketing/ProductsMegaMenu';

type LandingNavProps = {
  heroRef: React.RefObject<HTMLElement | null>;
};

export default function LandingNav({ heroRef }: LandingNavProps) {
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const update = () => {
      const { bottom } = hero.getBoundingClientRect();
      // Switch once the hero clears the nav bar (~96px tall)
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

  const onSolidBackground = solid || menuOpen;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300 ease-out ${
        onSolidBackground
          ? 'border-b border-gray-200 bg-[#F5F5F5]/95 shadow-sm backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 sm:h-24 items-center justify-between">
          <motion.div className="flex shrink-0 items-center" whileHover={{ scale: 1.02 }}>
            <Link
              href="/"
              className={`font-mono text-[1.35rem] font-semibold tracking-[-0.04em] transition-colors duration-300 sm:text-[1.5rem] ${
                onSolidBackground ? 'text-gray-900' : 'text-white'
              }`}
            >
              Oikaro
            </Link>
          </motion.div>
          <div className="flex-1" />
          <div className="flex items-center gap-3 sm:gap-4">
            <ProductsMegaMenu onSolidBackground={onSolidBackground} onOpenChange={setMenuOpen} />
            <Link href="/auth/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className={`px-4 sm:px-5 py-2.5 text-sm font-medium transition-colors duration-300 ${
                  onSolidBackground
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
                  onSolidBackground
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

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { PRODUCT_MENU_COLUMNS } from '@/lib/product-menu';
import { useMotionReduced } from '@/lib/motion';

type ProductsMegaMenuProps = {
  /** When true, nav sits on light background — dark trigger text */
  onSolidBackground?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function ProductsMegaMenu({
  onSolidBackground = true,
  onOpenChange,
}: ProductsMegaMenuProps) {
  const reduced = useMotionReduced();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setMenuOpen = useCallback(
    (next: boolean) => {
      setOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const handleEnter = () => {
    clearCloseTimer();
    setMenuOpen(true);
  };

  const handleLeave = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setMenuOpen(false), 120);
  };

  const handleClose = () => {
    clearCloseTimer();
    setMenuOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => () => clearCloseTimer(), []);

  const triggerClass = onSolidBackground
    ? 'text-gray-600 hover:text-gray-900'
    : 'text-white hover:text-white/85';

  return (
    <div
      className="relative hidden sm:block"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Link
        href="/products"
        className={`group inline-flex items-center gap-1 px-4 py-2.5 text-sm font-medium transition-colors duration-300 ${triggerClass}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Products
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? 'rotate-180' : 'group-hover:translate-y-px'}`}
          strokeWidth={2}
        />
      </Link>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="Close products menu"
              initial={reduced ? false : { opacity: 0 }}
              animate={reduced ? undefined : { opacity: 1 }}
              exit={reduced ? undefined : { opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 bg-black/35 backdrop-blur-lg"
              onClick={handleClose}
            />

            <div
              className="fixed inset-x-0 top-20 z-50 sm:top-24"
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
            >
              <div className="mx-auto h-3 max-w-7xl" aria-hidden />

              <motion.div
                initial={reduced ? false : { opacity: 0, y: -8 }}
                animate={reduced ? undefined : { opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                className="mx-auto w-[min(calc(100vw-2rem),72rem)] px-4 sm:px-0"
              >
              <div className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-[0_32px_80px_-24px_rgba(24,24,27,0.28)]">
                <div className="grid lg:grid-cols-[1fr_17rem]">
                  <div className="grid gap-8 p-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6 lg:p-10">
                    {PRODUCT_MENU_COLUMNS.map((column) => (
                      <div key={column.id}>
                        <p className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                          {column.label}
                        </p>
                        <ul className="space-y-1">
                          {column.tools.map((tool) => (
                            <li key={tool.id}>
                              <Link
                                href={tool.href}
                                onClick={handleClose}
                                className="group block rounded-xl px-3 py-2.5 transition-colors hover:bg-[#fafafa]"
                              >
                                <span className="block text-[15px] font-semibold text-gray-900 transition-colors group-hover:text-brand-600">
                                  {tool.name}
                                </span>
                                <span className="mt-0.5 block text-[13px] leading-snug text-gray-600">
                                  {tool.summary}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div className="relative min-h-[220px] overflow-hidden border-t border-gray-200/80 lg:border-l lg:border-t-0">
                    <Image
                      src="/landing/hero-mountains.jpg"
                      alt=""
                      fill
                      className="object-cover"
                      sizes="280px"
                      aria-hidden
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-black/55 via-black/35 to-brand-900/40 backdrop-blur-[2px]" />
                    <div className="relative flex h-full flex-col justify-between p-6 lg:p-7">
                      <div>
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
                          One platform
                        </p>
                        <p className="mt-3 text-lg font-semibold leading-snug text-white">
                          Everything you need to run your real estate business
                        </p>
                      </div>
                      <Link
                        href="/products"
                        onClick={handleClose}
                        className="group inline-flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-white"
                      >
                        Explore all products
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { PRODUCT_MENU_COLUMNS } from '@/lib/product-menu';
import { useMotionReduced } from '@/lib/motion';

type ProductsMegaMenuProps = {
  /** Nav sits on light scrolled background */
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
    closeTimer.current = setTimeout(() => setMenuOpen(false), 150);
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

  const triggerBase =
    'group inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300';

  const triggerClass = open
    ? onSolidBackground
      ? `${triggerBase} bg-gray-900 text-white shadow-sm`
      : `${triggerBase} bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-sm`
    : onSolidBackground
      ? `${triggerBase} text-gray-600 hover:bg-gray-100 hover:text-gray-900`
      : `${triggerBase} text-white hover:bg-white/10`;

  return (
    <div
      className="relative hidden sm:block"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Link
        href="/products"
        className={triggerClass}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Products
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </Link>

      <AnimatePresence>
        {open && (
          <>
            {/* Blur only page content below the nav — not the header */}
            <motion.button
              type="button"
              aria-label="Close products menu"
              initial={reduced ? false : { opacity: 0 }}
              animate={reduced ? undefined : { opacity: 1 }}
              exit={reduced ? undefined : { opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="fixed inset-x-0 bottom-0 top-20 z-40 bg-black/20 backdrop-blur-xl sm:top-24"
              onClick={handleClose}
            />

            <div
              className="fixed inset-x-0 top-20 z-50 sm:top-24"
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
            >
              {/* Invisible bridge so hover survives the gap between trigger and panel */}
              <div className="mx-auto h-4 max-w-7xl" aria-hidden />

              <motion.div
                initial={reduced ? false : { opacity: 0, y: -10, scale: 0.985 }}
                animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
                className="mx-auto w-[min(calc(100vw-1.5rem),72rem)] px-3 sm:px-6 lg:px-8"
              >
                <div className="rounded-[2rem] border border-gray-200/70 bg-white p-3 shadow-[0_40px_100px_-32px_rgba(24,24,27,0.35)] sm:rounded-[2.25rem] sm:p-3.5">
                  <div className="grid lg:grid-cols-[1fr_16.5rem] lg:gap-3">
                    <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4 lg:gap-4 lg:p-7">
                      {PRODUCT_MENU_COLUMNS.map((column) => (
                        <div key={column.id}>
                          <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                            {column.label}
                          </p>
                          <ul className="space-y-0.5">
                            {column.tools.map((tool) => (
                              <li key={tool.id}>
                                <Link
                                  href={tool.href}
                                  onClick={handleClose}
                                  className="group block rounded-2xl px-3 py-2 transition-colors hover:bg-[#f5f5f5]"
                                >
                                  <span className="block text-[14px] font-semibold leading-snug text-gray-900 transition-colors group-hover:text-brand-600">
                                    {tool.name}
                                  </span>
                                  <span className="mt-0.5 block text-[12px] leading-snug text-gray-600">
                                    {tool.summary}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>

                    <div className="relative min-h-[200px] overflow-hidden rounded-[1.35rem] sm:min-h-[220px] sm:rounded-[1.5rem] lg:min-h-0">
                      <Image
                        src="/landing/hero-mountains.jpg"
                        alt=""
                        fill
                        className="object-cover"
                        sizes="280px"
                        aria-hidden
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-brand-900/35" />
                      <div className="relative flex h-full min-h-[200px] flex-col justify-between p-5 sm:p-6">
                        <div>
                          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
                            One platform
                          </p>
                          <p className="mt-2.5 text-base font-semibold leading-snug text-white sm:text-[17px]">
                            Everything you need to run your real estate business
                          </p>
                        </div>
                        <Link
                          href="/products"
                          onClick={handleClose}
                          className="group inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-white/95"
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
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { PRODUCT_MENU_COLUMNS } from '@/lib/product-menu';
import { useMotionReduced } from '@/lib/motion';

type ProductsMegaMenuProps = {
  onSolidBackground?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function ProductsMegaMenu({
  onSolidBackground = true,
  onOpenChange,
}: ProductsMegaMenuProps) {
  const reduced = useMotionReduced();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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

  const scheduleClose = (delay = 100) => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setMenuOpen(false), delay);
  };

  const handleEnter = () => {
    clearCloseTimer();
    setMenuOpen(true);
  };

  const handleClose = () => {
    clearCloseTimer();
    setMenuOpen(false);
  };

  const isPointerOverMenu = useCallback((x: number, y: number) => {
    const target = document.elementFromPoint(x, y);
    if (!target) return false;
    return (
      Boolean(triggerRef.current?.contains(target)) ||
      Boolean(panelRef.current?.contains(target))
    );
  }, []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };

    const onMouseMove = (event: MouseEvent) => {
      if (isPointerOverMenu(event.clientX, event.clientY)) {
        clearCloseTimer();
        return;
      }
      scheduleClose(80);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [open, isPointerOverMenu]);

  useEffect(() => () => clearCloseTimer(), []);

  const triggerBase =
    'group inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 sm:gap-1.5 sm:px-4 sm:py-2 sm:text-sm';

  const triggerClass = open
    ? onSolidBackground
      ? `${triggerBase} bg-gray-900 text-white shadow-sm`
      : `${triggerBase} bg-white/20 text-white`
    : onSolidBackground
      ? `${triggerBase} text-gray-600 hover:bg-gray-100 hover:text-gray-900`
      : `${triggerBase} text-white hover:bg-white/10`;

  const menuPortal =
    mounted
      ? createPortal(
          <AnimatePresence>
            {open ? (
              <>
                <motion.button
                  key="products-menu-backdrop"
                  type="button"
                  aria-label="Close products menu"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={reduced ? undefined : { opacity: 1 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="fixed inset-0 z-[55] bg-black/10 backdrop-blur-xl"
                  onClick={handleClose}
                />

            <div
              key="products-menu-shell"
              className="pointer-events-none fixed inset-x-0 top-16 z-[56] flex justify-center px-3 sm:top-20 md:top-24 sm:px-6"
            >
              <motion.div
                ref={panelRef}
                initial={reduced ? false : { opacity: 0, y: -8 }}
                animate={reduced ? undefined : { opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                className="pointer-events-auto w-full max-w-[72rem]"
                onMouseEnter={handleEnter}
                onMouseLeave={() => scheduleClose(80)}
              >
                <div className="overflow-hidden rounded-[2rem] border border-gray-200/70 bg-white p-3 shadow-[0_40px_100px_-32px_rgba(24,24,27,0.35)] sm:rounded-[2.25rem] sm:p-3.5">
                  <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4 lg:gap-4 lg:p-7">
                    {PRODUCT_MENU_COLUMNS.map((column) => (
                      <div key={column.id} className="min-w-0">
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
                </div>
              </motion.div>
            </div>
              </>
            ) : null}
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        ref={triggerRef}
        className="relative hidden sm:block"
        onMouseEnter={handleEnter}
        onMouseLeave={() => scheduleClose(150)}
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
      </div>
      {menuPortal}
    </>
  );
}

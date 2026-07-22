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

  const triggerClass = open
    ? 'font-medium'
    : 'font-medium transition-opacity hover:opacity-70';

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
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-[55] bg-black/20"
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
                    className="pointer-events-auto w-full max-w-mkt-content"
                    onMouseEnter={handleEnter}
                    onMouseLeave={() => scheduleClose(80)}
                  >
                    <div className="overflow-hidden rounded-mkt-card border border-mkt-border bg-mkt-surface p-3 sm:p-4">
                      <div className="grid gap-6 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4 lg:gap-4">
                        {PRODUCT_MENU_COLUMNS.map((column) => (
                          <div key={column.id} className="min-w-0">
                            <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-mkt-secondary">
                              {column.label}
                            </p>
                            <ul className="space-y-0.5">
                              {column.tools.map((tool) => (
                                <li key={tool.id}>
                                  <Link
                                    href={tool.href}
                                    onClick={handleClose}
                                    className="group block rounded-mkt-button px-3 py-2 transition-colors hover:bg-[var(--surface)]/[0.05]"
                                  >
                                    <span className="block text-[14px] font-medium leading-snug text-mkt-foreground transition-opacity group-hover:opacity-70">
                                      {tool.name}
                                    </span>
                                    <span className="mt-0.5 block text-[12px] leading-snug text-mkt-secondary">
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
          className={`${triggerClass} inline-flex items-center gap-1 px-3 py-2 text-xs text-mkt-secondary sm:gap-1.5 sm:text-sm`}
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

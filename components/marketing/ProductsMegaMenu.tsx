'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { PRODUCT_MENU_COLUMNS } from '@/lib/product-menu';
import { useMotionReduced } from '@/lib/motion';

const NEW_TOOL_IDS = new Set(['ai-assistant']);
const CLOSE_DELAY_MS = 280;

type ProductsMegaMenuProps = {
  onOpenChange?: (open: boolean) => void;
};

export default function ProductsMegaMenu({ onOpenChange }: ProductsMegaMenuProps) {
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

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setMenuOpen(false), CLOSE_DELAY_MS);
  };

  const handleEnter = () => {
    clearCloseTimer();
    setMenuOpen(true);
  };

  const handleClose = () => {
    clearCloseTimer();
    setMenuOpen(false);
  };

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => () => clearCloseTimer(), []);

  const menuPortal =
    mounted
      ? createPortal(
          <AnimatePresence>
            {open ? (
              <motion.div
                ref={panelRef}
                key="products-menu-panel"
                initial={reduced ? false : { opacity: 0, y: -6 }}
                animate={reduced ? undefined : { opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                className="marketing-root fixed inset-x-0 top-[var(--mkt-nav-height)] z-[59] -mt-px bg-mkt-background pt-3 text-mkt-foreground"
                onMouseEnter={handleEnter}
                onMouseLeave={scheduleClose}
              >
                <div className="border-b border-[rgba(17,17,17,0.12)] border-t border-[rgba(17,17,17,0.14)] bg-mkt-background shadow-[0_16px_48px_-20px_rgba(17,17,17,0.14)]">
                  <div className="mx-auto max-w-mkt-content px-5 py-8 sm:px-8 sm:py-9 lg:py-10">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_260px] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_280px] xl:gap-8">
                      {PRODUCT_MENU_COLUMNS.map((column) => (
                        <div key={column.id} className="min-w-0">
                          <p className="mb-4 text-[13px] font-medium text-mkt-secondary">{column.label}</p>
                          <ul className="space-y-3">
                            {column.tools.map((tool) => (
                              <li key={tool.id}>
                                <Link
                                  href={tool.href}
                                  onClick={handleClose}
                                  className="group inline-flex items-center gap-2 text-[15px] font-semibold leading-snug tracking-[-0.01em] text-mkt-foreground transition-opacity hover:opacity-65"
                                >
                                  {tool.name}
                                  {NEW_TOOL_IDS.has(tool.id) ? (
                                    <span className="rounded bg-mkt-accent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em] text-mkt-accent-foreground">
                                      New
                                    </span>
                                  ) : null}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      <div className="min-w-0 lg:col-span-1">
                        <Link
                          href="/auth/signup"
                          onClick={handleClose}
                          className="group flex h-full min-h-[220px] flex-col justify-between overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-[#4a62d9] via-[#6b8af0] to-[#9eb8ff] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition-opacity hover:opacity-95 sm:min-h-[240px] sm:p-6"
                        >
                          <div
                            className="pointer-events-none h-24 rounded-xl bg-white/10 backdrop-blur-sm"
                            aria-hidden
                          />
                          <div>
                            <p className="text-sm font-medium text-white/75">Get started</p>
                            <p className="mt-1 text-lg font-bold leading-snug tracking-[-0.02em] text-white sm:text-xl">
                              Start your 7-day free trial
                            </p>
                            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white/90">
                              Try Oikaro
                              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                            </span>
                          </div>
                        </Link>
                      </div>
                    </div>

                    <div className="mt-8 border-t border-mkt-border pt-5">
                      <Link
                        href="/products"
                        onClick={handleClose}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-mkt-accent transition-opacity hover:opacity-70"
                      >
                        View all products
                        <ArrowRight className="size-4" strokeWidth={2.2} />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        ref={triggerRef}
        className="relative hidden md:block"
        onMouseEnter={handleEnter}
        onMouseLeave={scheduleClose}
      >
        <button
          type="button"
          className={`inline-flex items-center gap-1 px-3 py-2 text-sm transition-colors sm:gap-1.5 ${
            open ? 'font-semibold text-mkt-accent' : 'font-medium text-mkt-secondary hover:opacity-70'
          }`}
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => (open ? handleClose() : handleEnter())}
        >
          Products
          <ChevronDown
            className={`size-4 transition-transform duration-300 ${open ? 'rotate-180 text-mkt-accent' : ''}`}
            strokeWidth={2}
          />
        </button>
      </div>
      {menuPortal}
    </>
  );
}

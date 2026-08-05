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
  inverted?: boolean;
};

export default function ProductsMegaMenu({ onOpenChange, inverted = false }: ProductsMegaMenuProps) {
  const reduced = useMotionReduced();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
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

  const updateCoords = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({ top: rect.bottom + 10, left: rect.left });
  };

  const handleEnter = () => {
    clearCloseTimer();
    updateCoords();
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
    const onViewportChange = () => updateCoords();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onViewportChange);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onViewportChange);
    };
  }, [open]);

  useEffect(() => () => clearCloseTimer(), []);

  const menuPortal =
    mounted
      ? createPortal(
          <AnimatePresence>
            {open && coords ? (
              <motion.div
                ref={panelRef}
                key="products-menu-panel"
                initial={reduced ? false : { opacity: 0, y: -6, scale: 0.98 }}
                animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ position: 'fixed', top: coords.top, left: coords.left }}
                className="marketing-root z-[59] w-[520px] max-w-[calc(100vw-2.5rem)] origin-top-left rounded-2xl border border-mkt-border bg-white p-4 text-mkt-foreground shadow-[0_24px_48px_-16px_rgba(17,17,17,0.22)]"
                onMouseEnter={handleEnter}
                onMouseLeave={scheduleClose}
              >
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                  {PRODUCT_MENU_COLUMNS.map((column) => (
                    <div key={column.id} className="min-w-0">
                      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-mkt-muted">
                        {column.label}
                      </p>
                      <ul className="space-y-2">
                        {column.tools.map((tool) => (
                          <li key={tool.id}>
                            <Link
                              href={tool.href}
                              onClick={handleClose}
                              className="group inline-flex items-center gap-2 rounded-md text-[14px] font-medium leading-snug text-mkt-foreground transition-colors hover:text-mkt-accent"
                            >
                              {tool.name}
                              {NEW_TOOL_IDS.has(tool.id) ? (
                                <span className="rounded bg-mkt-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em] text-mkt-accent-foreground">
                                  New
                                </span>
                              ) : null}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-mkt-surface-muted px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-mkt-foreground">
                      Start your 7-day free trial
                    </p>
                    <p className="truncate text-[12px] text-mkt-secondary">Cancel anytime</p>
                  </div>
                  <Link
                    href="/auth/signup"
                    onClick={handleClose}
                    className="group inline-flex shrink-0 items-center gap-1 rounded-full bg-mkt-accent px-3.5 py-2 text-[12px] font-semibold text-mkt-accent-foreground transition-opacity hover:opacity-90"
                  >
                    Try Oikaro
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-mkt-border pt-3">
                  <Link
                    href="/products"
                    onClick={handleClose}
                    className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-mkt-accent transition-opacity hover:opacity-70"
                  >
                    View all products
                    <ArrowRight className="size-3.5" strokeWidth={2.2} />
                  </Link>
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
          className={`inline-flex items-center gap-1 px-3 py-2.5 text-[15px] transition-colors sm:gap-1.5 ${
            open
              ? inverted
                ? 'font-semibold text-white'
                : 'font-semibold text-mkt-accent'
              : inverted
                ? 'font-medium text-white/70 hover:text-white'
                : 'font-medium text-mkt-secondary hover:opacity-70'
          }`}
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => (open ? handleClose() : handleEnter())}
        >
          Products
          <ChevronDown
            className={`size-4 transition-transform duration-300 ${
              open ? `rotate-180 ${inverted ? 'text-white' : 'text-mkt-accent'}` : ''
            }`}
            strokeWidth={2}
          />
        </button>
      </div>
      {menuPortal}
    </>
  );
}

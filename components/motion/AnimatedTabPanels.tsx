'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import { tabPanelTransition, useMotionReduced } from '@/lib/motion';

interface AnimatedTabPanelsProps<T extends string> {
  activeTab: T;
  panels: { id: T; content: React.ReactNode }[];
  className?: string;
  /** Vertical slide distance in px when motion is enabled. */
  slideOffset?: number;
}

/** Keeps all tab panels mounted while crossfading the active one. */
export default function AnimatedTabPanels<T extends string>({
  activeTab,
  panels,
  className,
  slideOffset = 10,
}: AnimatedTabPanelsProps<T>) {
  const reduced = useMotionReduced();

  return (
    <div className={clsx('relative', className)}>
      {panels.map((panel) => {
        const active = panel.id === activeTab;
        return (
          <motion.div
            key={panel.id}
            role="tabpanel"
            aria-hidden={!active}
            initial={false}
            animate={{
              opacity: active ? 1 : 0,
              y: reduced || active ? 0 : slideOffset,
            }}
            transition={reduced ? { duration: 0.01 } : tabPanelTransition}
            // Hidden panels take no space — otherwise a long hidden tab leaves blank scroll room under the active one
            className={clsx(!active && 'pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden')}
          >
            {panel.content}
          </motion.div>
        );
      })}
    </div>
  );
}

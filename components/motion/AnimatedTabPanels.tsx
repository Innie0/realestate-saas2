'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import { tabPanelTransition, useMotionReduced } from '@/lib/motion';

interface AnimatedTabPanelsProps<T extends string> {
  activeTab: T;
  panels: { id: T; content: React.ReactNode }[];
  className?: string;
}

/** Keeps all tab panels mounted while crossfading the active one. */
export default function AnimatedTabPanels<T extends string>({
  activeTab,
  panels,
  className,
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
              y: reduced || active ? 0 : 8,
            }}
            transition={reduced ? { duration: 0.01 } : tabPanelTransition}
            className={clsx(!active && 'pointer-events-none absolute inset-x-0 top-0')}
          >
            {panel.content}
          </motion.div>
        );
      })}
    </div>
  );
}

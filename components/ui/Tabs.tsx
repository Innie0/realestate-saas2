'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useMotionReduced } from '@/lib/motion';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ElementType<{ className?: string; strokeWidth?: number }>;
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
  hideLabelsOnMobile?: boolean;
}

export default function Tabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  className,
  hideLabelsOnMobile = false,
}: TabsProps<T>) {
  const reduced = useMotionReduced();

  return (
    <div
      className={clsx('flex gap-0.5 p-1 bg-gray-100/80 rounded-xl', className)}
      role="tablist"
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={clsx(
              'relative flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
              active ? 'text-gray-900' : 'text-gray-700 hover:text-gray-800'
            )}
          >
            {active && !reduced && (
              <motion.span
                layoutId="tabs-active-pill"
                className="absolute inset-0 rounded-lg bg-[var(--surface)] border border-gray-200"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            {active && reduced && (
              <span className="absolute inset-0 rounded-lg bg-[var(--surface)] border border-gray-200" />
            )}
            {Icon && <Icon className="relative z-10 w-4 h-4 flex-shrink-0" />}
            <span
              className={clsx(
                'relative z-10',
                hideLabelsOnMobile ? 'hidden sm:inline' : undefined
              )}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

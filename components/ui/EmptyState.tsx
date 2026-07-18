'use client';

import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { emptyStateIcon, emptyStateText, useMotionReduced } from '@/lib/motion';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const reduced = useMotionReduced();

  const iconBlock = (
    <div className="relative inline-flex items-center justify-center w-12 h-12 mb-5">
      {/* Concentric halo rings give the icon presence without heaviness */}
      <span className="absolute -inset-4 rounded-full border border-gray-200/40" aria-hidden />
      <span className="absolute -inset-1.5 rounded-full border border-gray-200/70" aria-hidden />
      <span className="absolute inset-0 rounded-full bg-white ring-1 ring-gray-200 shadow-surface" aria-hidden />
      <Icon className="relative w-5 h-5 text-gray-700" strokeWidth={1.5} />
    </div>
  );

  const textBlock = (
    <>
      <h3 className="text-base font-semibold tracking-tight text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-700 max-w-sm mx-auto mb-5">{description}</p>
      )}
      {action}
    </>
  );

  return (
    <div className={clsx('text-center py-14 px-4', className)}>
      {reduced ? (
        <>
          {iconBlock}
          {textBlock}
        </>
      ) : (
        <>
          <motion.div initial="initial" animate="animate" variants={emptyStateIcon} className="inline-block">
            {iconBlock}
          </motion.div>
          <motion.div initial="initial" animate="animate" variants={emptyStateText}>
            {textBlock}
          </motion.div>
        </>
      )}
    </div>
  );
}

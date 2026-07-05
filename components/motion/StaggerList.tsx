'use client';

import { motion } from 'framer-motion';
import clsx from 'clsx';
import { staggerContainer, staggerItem, useMotionReduced } from '@/lib/motion';

interface StaggerListProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'tbody' | 'ul';
}

export default function StaggerList({ children, className, as = 'div' }: StaggerListProps) {
  const reduced = useMotionReduced();
  const Component = motion[as] as typeof motion.div;

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Component
      className={clsx(className)}
      initial="initial"
      animate="animate"
      variants={staggerContainer}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({
  children,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'tr' | 'li';
}) {
  const reduced = useMotionReduced();
  const Component = motion[as] as typeof motion.div;

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Component className={className} variants={staggerItem}>
      {children}
    </Component>
  );
}

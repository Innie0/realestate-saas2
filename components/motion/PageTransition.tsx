'use client';

import { motion } from 'framer-motion';
import { pageVariants, useMotionReduced } from '@/lib/motion';

interface PageTransitionProps {
  children: React.ReactNode;
  /** Applied to the wrapping element — e.g. space-y-* for section spacing. */
  className?: string;
}

/**
 * Always renders a wrapping element (never a bare Fragment) so that spacing
 * utilities like space-y-* behave the same whether or not motion is reduced.
 */
export default function PageTransition({ children, className }: PageTransitionProps) {
  const reduced = useMotionReduced();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} initial="initial" animate="animate" variants={pageVariants}>
      {children}
    </motion.div>
  );
}

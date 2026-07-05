'use client';

import { motion } from 'framer-motion';
import { pageVariants, useMotionReduced } from '@/lib/motion';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const reduced = useMotionReduced();

  if (reduced) {
    return <>{children}</>;
  }

  return (
    <motion.div initial="initial" animate="animate" variants={pageVariants}>
      {children}
    </motion.div>
  );
}

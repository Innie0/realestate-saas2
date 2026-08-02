'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import clsx from 'clsx';
import { useMotionReduced } from '@/lib/motion';

type DraggableCardRowProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
};

export function DraggableCardRow({
  children,
  className,
  contentClassName,
  style,
}: DraggableCardRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [dragConstraint, setDragConstraint] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const prefersReducedMotion = useMotionReduced();

  useEffect(() => {
    const updateConstraint = () => {
      if (containerRef.current && contentRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const contentWidth = contentRef.current.scrollWidth;
        setDragConstraint(Math.min(0, containerWidth - contentWidth));
      }
    };

    updateConstraint();
    window.addEventListener('resize', updateConstraint);

    const observer = new ResizeObserver(updateConstraint);
    if (containerRef.current) observer.observe(containerRef.current);
    if (contentRef.current) observer.observe(contentRef.current);

    return () => {
      window.removeEventListener('resize', updateConstraint);
      observer.disconnect();
    };
  }, [children]);

  if (prefersReducedMotion) {
    return (
      <div
        className={clsx(
          'flex gap-7 overflow-x-auto px-10 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          className,
        )}
        style={style}
      >
        {children}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={clsx('overflow-hidden', className)} style={style}>
      <motion.div
        ref={contentRef}
        className={clsx('flex w-max gap-7 px-10', contentClassName)}
        drag="x"
        dragConstraints={{ left: dragConstraint, right: 0 }}
        dragElastic={0.08}
        dragTransition={{ power: 0.3, timeConstant: 250 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: isDragging ? 'none' : 'auto',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

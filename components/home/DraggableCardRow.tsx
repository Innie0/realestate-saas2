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
      const container = containerRef.current;
      const content = contentRef.current;
      if (!container || !content) return;

      const containerWidth = container.offsetWidth;
      const contentWidth = content.scrollWidth;
      setDragConstraint(Math.min(0, containerWidth - contentWidth));
    };

    updateConstraint();
    window.addEventListener('resize', updateConstraint);

    const observer = new ResizeObserver(updateConstraint);
    const container = containerRef.current;
    const content = contentRef.current;
    if (container) observer.observe(container);
    if (content) observer.observe(content);

    return () => {
      window.removeEventListener('resize', updateConstraint);
      observer.disconnect();
    };
  }, [children]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || prefersReducedMotion) return;

    const blockHorizontalWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        event.preventDefault();
      }
    };

    container.addEventListener('wheel', blockHorizontalWheel, { passive: false });
    return () => container.removeEventListener('wheel', blockHorizontalWheel);
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div className={clsx('flex flex-col gap-7 px-10', className)} style={style}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={clsx('overflow-hidden overscroll-x-contain', className)}
      style={style}
      aria-label="Drag or swipe horizontally to browse cards"
    >
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
